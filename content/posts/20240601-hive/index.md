---
title: "Hive Setup and Operations"
summary: "This article is about how to deploy Hive services on Hadoop Cluster, which components it has, how the data is stored and managed in Hive, how the calculation is done via MapReduce, and how Yarn manage the resources"
description: "This article is about how to deploy Hive services on Hadoop Cluster, which components it has, how the data is stored and managed in Hive, how the calculation is done via MapReduce, and how Yarn manage the resources"
categories: ["Docker","Hadoop","Data Engineering"]
tags: ["tutorial", "hdfs", "hive", "mapreduce", "postgres", "catalog"]
date: 2024-06-01
draft: false
showauthor: false
authors:
  - nacisimsek
---
# Hive Deployment and Operations

In [previous article](https://nacisimsek.com/posts/20240509-hadoop-deploy/ "Deploy Hadoop Cluster"), we had deployed our Hadoop cluster on docker, accessed to both HDFS and YARN UIs, and performed some simple file operations on HDFS.

In this article, we will be deploying Hive services on the same Hadoop cluster and perform various operations on it to learn its basics, usage, and advantages it brings for our data operations. If you directly opened this article without setting up your docker environment, I suggest you first visit that [article](https://nacisimsek.com/posts/20240509-hadoop-deploy/#deployment-of-the-cluster "Deployment of the Cluster") to deploy your cluster first.

> ❗️ **Important:**
>
> Since the image that is being used in this experiment is built with the needed Hive services included, we are able to run Hive services in this cluster. If you are working on your own cluster built on top of different image, the operations/commands used in this article may not be compatible for your environment.

## Introduction to Hive

Welcome to the world of Hive! If you're new to this tool, don't worry—by the end of this post, you'll have a clear understanding of what Hive is, why it was created, and how it works. Let's get started!

### What is Hive?

Hive is like a friendly translator that helps you talk to your big data. Imagine you have a massive library filled with books (data), but they're all written in different languages. You want to ask questions about the books, but you don't speak those languages. Hive steps in to help! It allows you to use SQL (Structured Query Language), which is a common language for databases, to interact with your data stored in Hadoop, a framework for storing and processing large data sets.

* It allows querying the data stored on HDFS with a SQL-like language.
* Created by Facebook. Handed over Apache community.
* It processes structured data that can be stored in a table.
* The mode it works is batch processing, not real-time (streaming data).
* It uses engines like: MapReduce, Tez or Spark.
* It supports many different file formats: Parquet, Sequence, ORC, Text, etc.


> ❗️ **Important:**
>
> * Hive is not a database.
> * Not suitable to be used for operational database needs (OLTP), since it focuses on heavy analytics queries.
> * Its not suitable for row based insert, update and delete, or interactive queries.
> * The query takes a reasonable amount of time. Converts query to MapReduce/Tez code, get resources from YARN and then starts the operation.
> * HiveQL is not standard SQL. Should not expect everything as in SQL.


### Why was Hive Built?

In the early days of Hadoop, data analysts and scientists had to write complex and lengthy MapReduce Java programs to analyze data. This was time-consuming, error-prone, and required a deep understanding of programming languages like Java or Python.Hive was built to simplify this process. It provides a familiar SQL-like interface that allows users to query and analyze data without needing to write complex code. This makes it easier for data analysts, scientists, and even business users to work with Big Data, without requiring extensive programming knowledge.

### How does Hive Work?

Hive works by converting your SQL queries into a series of MapReduce jobs that run on Hadoop. Let’s break this down with a simple example:Imagine you run a bookstore and have a massive spreadsheet (your data) that lists all your books, their authors, prices, and sales numbers. You want to find out which books by a specific author sold the most copies last year. With Hive, you can write a simple SQL query like:

```sql
SELECT title, SUM(sales) FROM books WHERE author = 'J.K. Rowling' AND year = 2022 GROUP BY title ORDER BY SUM(sales) DESC;
```

When you run this query, Hive translates it into a series of steps that Hadoop understands (MapReduce jobs), processes the data, and then gives you the results. This way, you don’t need to worry about the complex underlying processes; you just get the information you need quickly and efficiently.In summary, Hive acts as a bridge between you and your data, making it easier to ask questions and get answers without needing to dive into the complexities of Hadoop. It’s like having a knowledgeable assistant who can not only find the information you need but also present it in a way that’s easy to understand.

### Hive Architecture

The following are the major components of Apache Hive Architecture.

![1723908984129](image/index/1723908984129.png "Hive Architecture")

* **Metastore (RDBMS)**: Think of the Metastore as a library catalog. It stores information about the data, like where it's located, what it looks like, and how it's organized. This helps Hive keep track of the data and make sense of it. In our cluster, its PostgreSQL DB.
* **Driver**: The Driver is like a manager. It creates a session, receives instructions from the user, and monitors the execution process. It also keeps track of the metadata (information about the data) while running queries.
* **Compiler**: The Compiler is like a translator. It takes the HiveQL query (a question written in Hive's language) and converts it into a plan that Hadoop MapReduce can understand. It breaks down the query into smaller steps and creates a roadmap for execution.
* **Optimizer**: The Optimizer is like a performance coach. It looks at the plan created by the Compiler and finds ways to make it more efficient. It might combine multiple steps into one or rearrange them to get the best results.
* **Executor**: The Executor is like a team leader. It takes the optimized plan and works with Hadoop to execute it. It ensures that all the necessary tasks are completed and in the right order.
* **Thrift Server and CLI/UI**: The Thrift Server is like a receptionist. It allows external clients to interact with Hive using standard protocols like JDBC or ODBC. The CLI (Command-Line Interface) and UI (User Interface) provide a way for users to run HiveQL queries and interact with Hive directly.

## Hive Operations

Without further theory, lets dive into our hands-on exercises where we start hive services, deploy the metadata database and tables in the underlying RDBMS (its PostgreSQL in our cluster), create Hive databases and tables, insert data into our tables, see how the data in these tables reflect in the underlying storage layer HDFS, learn the difference between internal and external table terms, play with partitioning and bucketing, and finally cover the performance optimization tips.

### Starting Hive Services

Check if the containers of our Hadoop cluster are up and running. See [this](https://nacisimsek.com/posts/20240509-hadoop-deploy/#deployment-of-the-cluster "Cluster Deployment") chapter on how to deploy this cluster.

```powershell
docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Status}}'
```

```
CONTAINER ID   NAMES                 STATUS
6ad193be83c3   cluster-slave-1       Up 12 days
d04cd3f43266   cluster-slave-2       Up 12 days
fa725f0c0bd9   cluster-master        Up 12 days
02571464b056   postgresql            Up 12 days
```

Logging into the shell of the container `cluster-master` 

```powershell
docker exec -it cluster-master bash
```

#### Hive Schema Initialization

Initialize the Hive metastore schema in a PostgreSQL database

> ❗️ **Important:**
>
> Schema initialization is only needed to be performed for the first run of the Hive services. Once all the metadata tables are ready on Postgres, you no need to initialize them again.

```powershell
schematool -initSchema -dbType postgres
```

Below should be how the output looks like.

```apache
Metastore connection URL:	 jdbc:postgresql://postgresql:5432/metastore
Metastore Connection Driver :	 org.postgresql.Driver
Metastore connection User:	 postgres
Starting metastore schema initialization to 3.1.0
Initialization script hive-schema-3.1.0.postgres.sql
Initialization script completed
schemaTool completed
```

We can verify on PostgreSQL that the database metastore is created with all its metadata tables:

![1723911864670](image/index/1723911864670.png)

#### Starting Hive Services

We will then start the Hive services, that includes:

* **Hive Metastore**: A central repository that stores metadata about Hive tables, partitions, and schemas.
* **HiveServer2**: A service that allows clients to execute queries against Hive and retrieve results.

```bash
$HADOOP_HOME/start-hive.sh
```

```
Services starting up. Waiting for 60 seconds...
Hive Metastore and HiveServer2 services have been started successfully.
```



#### Connect Beeline HiveQL CLI

After the Hive service is started, we will connect to it using the Beeline CLI (Command Line Interface).


This command will connect us to a Hive server running on "cluster-master" using the default port 10000, allowing us to interact with Hive and run HiveQL queries.

```bash
beeline -u jdbc:hive2://cluster-master:10000
```

```
Connecting to jdbc:hive2://cluster-master:10000
Connected to: Apache Hive (version 3.1.3)
Driver: Hive JDBC (version 2.3.9)
Transaction isolation: TRANSACTION_REPEATABLE_READ
Beeline version 2.3.9 by Apache Hive
```


> 📝 **Note**:
>
> If you face below issue when trying to connect beeline CLI, its most probably related with your postgres container's volume access.
>
> ```
> Connecting to jdbc:hive2://cluster-master:10000
> Could not open connection to the HS2 server. Please check the server URI and if the URI is correct, then ask the administrator to check the server status.
> Error: Could not open client transport with JDBC Uri: jdbc:hive2://cluster-master:10000: java.net.ConnectException: Connection refused (Connection refused) (state=08S01,code=0)
> ```
>
> To fix it, either update the volume settings of the docker compose file and mount the container volumes to a local volume, or make sure to start containers with `docker-compose up -d` command executed by a `root` user or another user which has access to the local volume folders created by docker.




### Creating a Hive Database and a Table

We are now ready to perform our HiveQL database and table operations on Beeline.

Below command is used to list the available databases:

```bash
show databases;

INFO  : Compiling command(queryId=root_20240818123321_a5886e81-31b2-493d-93e1-88e05b7431f7): show databases
INFO  : Concurrency mode is disabled, not creating a lock manager
INFO  : Semantic Analysis Completed (retrial = false)
INFO  : Returning Hive schema: Schema(fieldSchemas:[FieldSchema(name:database_name, type:string, comment:from deserializer)], properties:null)
INFO  : Completed compiling command(queryId=root_20240818123321_a5886e81-31b2-493d-93e1-88e05b7431f7); Time taken: 0.016 seconds
INFO  : Concurrency mode is disabled, not creating a lock manager
INFO  : Executing command(queryId=root_20240818123321_a5886e81-31b2-493d-93e1-88e05b7431f7): show databases
INFO  : Starting task [Stage-0:DDL] in serial mode
INFO  : Completed executing command(queryId=root_20240818123321_a5886e81-31b2-493d-93e1-88e05b7431f7); Time taken: 0.017 seconds
INFO  : OK
INFO  : Concurrency mode is disabled, not creating a lock manager
+----------------+
| database_name  |
+----------------+
| default        |
+----------------+
1 row selected (0.119 seconds)
```


> 📝 **Note**: 
>
> As seen above, with the command output, also many other logs get pinted. Simply use the below command to turn the logging function off for this session:
>
> ```
> set hive.server2.logging.operation.level=NONE;
> ```
>
> If we would like to turn logging of system-wide, this needs to be set on the below config file of hive:
>
> `./usr/local/hive/conf/hive-site.xml`


### Loading Data into a Hive Table from CSV File and Perform Query


#### Internal Hive Table Creation

#### External Hive Table Creation

### File Formats and Compressions

### Partitioning and Bucketing
