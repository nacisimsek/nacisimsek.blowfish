---
title: "Hadoop Cluster Deployment and Operations"
summary: "This article is about how to deploy Hadoop Cluster, which components it has, how the data is stored and managed in HDFS, how the calculation is done via MapReduce, and how Yarn manage the resources"
description: "This article is about how to deploy Hadoop Cluster, which components it has, how the data is stored and managed in HDFS, how the calculation is done via MapReduce, and how Yarn manage the resources"
categories: ["Docker", "Hadoop","Data Engineering"]
tags: ["tutorial", "hdfs", "yarn", "mapreduce", "datanode", "namenode"]
date: 2024-05-09
draft: false
showauthor: false
authors:
  - nunocoracao
---
# Hadoop Cluster Deployment and Operations

In this article, we will be deploying Hadoop cluster on our local Docker environment with 1 Master (namenode & datanode) and 2 slave nodes (datanodes only) and perform data operations. We will be storing data into HDFS, and observe its operations on Hadoop UI.

In the world of big data, managing and processing vast amounts of information efficiently has always been a challenge. Traditional systems struggled to keep up with the growing volume, velocity, and variety of data. This is where Hadoop, an open-source framework, revolutionized the landscape of data processing and storage.

## Introduction to Hadoop

### What is Hadoop?

Hadoop is designed to store and process large datasets across clusters of computers using a simple programming model. It is highly scalable, cost-effective, and fault-tolerant, making it ideal for handling big data.

### Why was Hadoop Built?

Before Hadoop, traditional systems struggled with the limitations of single-node processing and storage, leading to issues like high costs, limited scalability, and poor fault tolerance. Hadoop was designed to address these challenges by:

* **Scalability** : Easily adding more nodes to handle increasing data loads.
* **Cost-Effectiveness** : Using commodity hardware to build large clusters.
* **Fault Tolerance** : Ensuring data availability and reliability even if some nodes fail.
* **High Throughput** : Efficiently processing large datasets in parallel.

**Comparing to Legacy Systems**

Traditional data processing systems were often limited by their ability to scale and handle large, diverse datasets efficiently. They typically relied on expensive, high-end hardware and faced significant challenges in terms of fault tolerance and scalability. Hadoop, with its distributed architecture, addressed these limitations by providing a robust, scalable, and cost-effective solution for big data processing.

With Hadoop, data storage and the computation both handled on the nodes which consist the Hadoop cluster.

![image title](https://dz2cdn1.dzone.com/storage/temp/10071134-hdfsarchitecture.png)

### How does Hadoop Work?

Hadoop's architecture is built around three main components: HDFS, MapReduce, and YARN.

1. **HDFS (Hadoop Distributed File System)** :

* **Purpose** : HDFS is designed to store large files by distributing them across multiple machines in a cluster.
* **How It Works** : HDFS breaks down a large file into smaller blocks and stores them across different nodes in the cluster. This distribution allows for parallel processing and ensures data availability, even if some nodes fail.
* **Logic** : By spreading the data, HDFS provides high throughput and reliability, addressing the limitations of single-node storage systems.

  <iframe width="560" height="315" src="https://www.youtube.com/embed/4Gfl0WuONMY?si=XMSprT5rtXUxBqpk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

2. **MapReduce** :

* **Purpose** : MapReduce is the core processing engine of Hadoop, designed to process large datasets in parallel.
* **How It Works** : It breaks down a task into two main functions: Map and Reduce.

  * **Map Function** : Processes input data and converts it into a set of intermediate key-value pairs.
  * **Reduce Function** : Merges these intermediate values to produce the final output.
* **Logic** : This parallel processing model allows Hadoop to handle large-scale data analysis efficiently, overcoming the bottlenecks of traditional sequential processing.

  <iframe width="560" height="315" src="https://www.youtube.com/embed/bcjSe0xCHbE?si=jVlJSxDC7HZPRaDf" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

3. **YARN (Yet Another Resource Negotiator)** :

* **Purpose** : YARN manages and allocates resources to various applications running in a Hadoop cluster.
* **How It Works** : It consists of a ResourceManager and NodeManagers. The ResourceManager allocates resources based on the needs of the applications, while NodeManagers monitor resources on individual nodes.
* **Logic** : YARN enhances Hadoop’s scalability and resource utilization, enabling multiple data processing engines to run simultaneously on a single cluster.

### What are the Disadvantages of Hadoop Comparing to Modern Data Systems?

Hadoop was a groundbreaking solution for big data, but modern data systems have emerged with enhancements that address many of its limitations. Here’s a look at some key disadvantages of Hadoop:

* **Complexity in Management and Configuration**: Requires specialized knowledge for setup, configuration, and maintenance, which can be complex and time-consuming.
* **Performance and Latency**: Primarily batch-oriented with high latency in processing large datasets.
* **Resource Efficiency**: Often resource-intensive with significant computational and storage demands.
* **Flexibility and Ecosystem Integration**: Limited flexibility with a strong focus on MapReduce and a more rigid ecosystem.
* **Scalability and Elasticity**: Adding new nodes is not fast or easy, requiring manual intervention and planning.
* **Data Handling and Processing Capabilities**: Computation and storage are tightly coupled, limiting flexibility in resource allocation.

## Deployment of the Cluster

We will deploy the cluster by using the following docker file:

[https://github.com/nacisimsek/Data_Engineering/blob/main/Hadoop/docker-compose.yaml](https://github.com/nacisimsek/Data_Engineering/blob/main/Hadoop/docker-compose.yaml "docker-compose.yaml")

Simply copy the docker compose file and execute below command to deploy the containers.

```bash
docker-compose up -d
```

This will compose the following four containers:

* cluster-master
* cluster-slave-1
* cluster-slave-2
* postgresql

List the containers and their status with the following command:

```bash
docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Status}}'
```

```bash
CONTAINER ID   NAMES                        STATUS
362d93c0d28a   cluster-slave-1              Up About an hour
5e69cc3072aa   cluster-slave-2              Up About an hour
bd3276aa0e7f   cluster-master               Up About an hour
63ea237d5907   postgresql                   Up About an hour
```

We should be now accessing to the Hadoop NameNode Web UI (Port 9870) and YARN ResourceManager Web UI (Port 8088)

### Port 9870: Hadoop NameNode Web UI

![1715444187605](image/index/1715444187605.png)

* **Purpose** :
  * The web interface on port 9870 is the Hadoop NameNode Web UI. It is used for monitoring the HDFS (Hadoop Distributed File System).
* **Functions** :
  * **View HDFS Health** : Provides an overview of the HDFS, including the health and status of the NameNode.
  * **Browse File System** : Allows users to browse the HDFS directories and files.
  * **Check DataNode Status** : Displays the status and details of all DataNodes in the cluster, including storage utilization and block distribution.
  * **Monitor Replication** : Shows information about block replication and under-replicated blocks.
  * **View Logs** : Access NameNode logs for troubleshooting and monitoring.
* **Key Features** :
  * **HDFS Overview** : Presents a summary of the total and available storage.
  * **DataNodes Information** : Details on each DataNode’s storage capacity, usage, and health.
  * **HDFS Metrics** : Metrics on file system operations, such as read and write requests.

> 📝 **Note:**
>
> If you do not see all three nodes listed as Datanode in above list, its most likely the DataNode service is stopped or should be restarted on those nodes. If so, you can connect to the respective container's shell and restart DataNode service as follows:
>
> `docker exec -it `
>
> `hdfs --daemon start datanode`

> ❗️ **Important:**
>
> Normally in commercial systems, the master node should not be using as a DataNode, but here in this cluster, for testing purposes, we assume the master node is also one of the DataNode.

### Port 8088: YARN ResourceManager Web UI

![1715444278531](image/index/1715444278531.png)

* **Purpose** :
  * The web interface on port 8088 is the YARN ResourceManager Web UI. It is used for managing and monitoring YARN (Yet Another Resource Negotiator), which handles resource allocation and job scheduling in the Hadoop cluster.
* **Functions** :
  * **Monitor Applications** : Displays the status of running and completed applications (jobs) within the cluster.
  * **View Cluster Metrics** : Provides metrics on resource usage, including memory and CPU utilization across the cluster.
  * **Track Application Logs** : Allows users to access logs for individual applications, aiding in troubleshooting and performance analysis.
  * **Manage Nodes** : Lists all the nodes in the cluster with details about their resource usage and health.
* **Key Features** :
  * **Application Overview** : Summarizes the state, resource usage, and history of applications.
  * **Cluster Utilization** : Shows real-time data on how resources are being utilized across the cluster.
  * **Node Management** : Information on each NodeManager, including available and used resources.

> 📝 **Note:**
>
> If you do not see all three nodes listed as Active Nodes in above page, its most likely the NodeManager service is stopped or should be restarted on those nodes. If so, you can connect to the respective container's shell and restartNodeManager service as follows:
>
> ```
>> docker exec -it cluster-slave-2 /bin/bash
> root@cluster-slave-2:/# jps
> 480 DataNode
> 929 GetConf
> 1416 Jps
> 798 SecondaryNameNode
>
> /usr/local/hadoop/sbin/yarn-daemon.sh start nodemanager
> ```


## Cluster Operations

We will be performing operations on HDFS and YARN to get familiar with them.

### HDFS Operations

### YARN Operations
