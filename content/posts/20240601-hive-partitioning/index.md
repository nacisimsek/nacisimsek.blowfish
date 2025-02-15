---
title: "Hive Partitioning and Bucketing"
summary: "This article is about how to perform partitioning and bucketing on Hive Tables"
description: "This article is about how to perform partitioning and bucketing on Hive Tables"
categories: ["Docker","Hadoop","Data Engineering"]
tags: ["tutorial", "hdfs", "hive", "mapreduce", "postgres", "catalog"]
date: 2024-06-01
draft: false
showauthor: false
authors:
  - nacisimsek
---
# Hive Partitioning and Bucketing

In the [previous article](https://nacisimsek.com/posts/20240601-hive/ "Hive Setup and Operations"), we created Hive tables and observe data usage on HDFS and metadata management.

In this article, we will be performing partitioning and bucketing options and observe how applying these techniques can help us on query performance.

{{< alert icon="circle-info" cardColor="#0096ff" iconColor="#f1faee" textColor="#f1faee" >}}

**Info**: 

If you directly opened this article without setting up your Docker environment, I suggest you visit that [`article`](https://nacisimsek.com/posts/20240509-hadoop-deploy/#deployment-of-the-cluster "Deployment of the Cluster") to deploy your cluster first.

{{< /alert >}}

## Data Organization in Hive

There are four main components for organizing data in Hive: `databases`, `tables`, `partitions`, and `buckets`. **Partitions** and **buckets** are key techniques to improve query performance by dividing tables into smaller, manageable pieces.

Think of it this way:

* **Database**: Corresponds to a directory in HDFS.
* **Table**:  Also corresponds to a directory within the database directory in HDFS.
* **Partition**: A subdirectory within the table directory, used to further divide data based on partition keys.
* **Bucket**: File segments within a partition (or table if not partitioned), organizing data within those directories.

Partitioning allows for faster data access by co-locating frequently queried data within the same folders. Bucketing, on the other hand, distributes data into file segments based on a hash of the bucket column, which is beneficial for query and join performance.

Imagine a large retail chain that processes thousands of sales orders every day. To manage this massive flow of data efficiently, the company organizes its orders in two steps:

**1.** **Partitioning by Date:**

Every order is stored in a folder corresponding to the day it was placed. For instance, all orders from September 1, 2023, are stored together, all orders from September 2, 2023, are in another folder, and so on. This means that if you need to retrieve or analyze orders from a particular day, you only need to look at that day's folder rather than the entire dataset.

**2.** **Bucketing by Store Location:**

Within each daily folder, orders are further grouped by the store where they were made. Each store's orders are kept in a separate bucket. So, if the chain has multiple stores (for example, Store A, Store B, Store C), orders from the same store on a specific day will be grouped together. This makes it much faster to run queries that focus on a particular store, such as joining order data with store-specific information.

Here's a simple tree representation to illustrate this:

```apache
Sales Orders Warehouse
├── Date: 2023-09-01
│   ├── Bucket: Store A
│   ├── Bucket: Store B
│   └── Bucket: Store C
├── Date: 2023-09-02
│   ├── Bucket: Store A
│   ├── Bucket: Store B
│   └── Bucket: Store C
└── Date: 2023-09-03
├── Bucket: Store A
├── Bucket: Store B
└── Bucket: Store C
```

In this setup, if you want to analyze orders from September 2, 2023, you directly go to that day's folder. Then, if you're interested in orders from Store B on that day, you only look at the bucket for Store B. This layered organization reduces the amount of data that needs to be scanned and processed, leading to faster query and join performance.

{{< alert icon="lightbulb" cardColor="#71ad47" iconColor="#f1faee" textColor="#f1faee" >}}

**Tip**:  

Columns chosen for partitioning should generally be those frequently used in `WHERE` clauses for filtering data, and should have low cardinality to avoid creating too many small partitions, which can hurt performance. Avoid partitioning by unique IDs like user IDs or phone numbers.

{{< /alert >}}

{{< alert icon="lightbulb" cardColor="#71ad47" iconColor="#f1faee" textColor="#f1faee" >}}

**Tip**: 

Bucketing is especially effective when the bucketed column is used in `GROUP BY` or `SORT BY` clauses in your queries, as it can optimize these operations significantly. Aim for a bucket size that is a multiple of the HDFS block size or around 1GB, using the formula: `Table size / Number of buckets >= HDFS block size` or `table size / 1 GB`.

{{< /alert >}}

## Partitioning Operations

Partitioning in Hive involves dividing a table into smaller parts based on the values of one or more partition keys. This allows Hive to retrieve only the relevant partitions during a query, significantly reducing the amount of data scanned and improving query performance.

### Creating a Partitioned Table

Let's look at an example of creating a partitioned table. In this case, we'll partition a sales table by `sales_date`.

```sql
create database test1;
```

```sql_more
CREATE TABLE IF NOT EXISTS
test1.sales_partitioned_by_date (
sales_id int,
country string,
product_id int,
product_name string,
quantity int,
unit_price float)
partitioned by (sales_date date)
row format delimited
fields terminated by ','
lines terminated by '\n'
stored as ORC;
```

{{< alert icon="tip" cardColor="#71ad47" iconColor="#f1faee" textColor="#f1faee" >}}

**Tip**: Notice that the partition column (`sales_date` in this example) is defined separately in the `PARTITIONED BY` clause and is **not** included in the column definitions within the parentheses before it.

{{< /alert >}}

### Static and Dynamic Partitioning

Hive supports two main types of partitioning: static and dynamic.

* **Static Partitioning**: In static partitioning, you manually create each partition and explicitly specify the partition when loading data. This is suitable when you know the partition values beforehand.
* **Dynamic Partitioning**: Hive automatically creates partitions based on the data being inserted.  The `CREATE TABLE` syntax is the same as for static partitioning. To enable dynamic partitioning, you need to set the following properties:

```nginx
set hive.exec.dynamic.partition=true;
set hive.exec.dynamic.partition.mode=nonstrict;
```

When dynamic partitioning is enabled, Hive will automatically infer and create new partitions as new partition key values are encountered during data loading.

{{< alert icon="tip" cardColor="#71ad47" iconColor="#f1faee" textColor="#f1faee" >}}

**Tip**: 

When using dynamic partitioning, ensure that the partition column(s) are placed **last** in the `INSERT` statement's `SELECT` clause or `VALUES` clause.

{{< /alert >}}

#### When to use which?

* **Static Partitioning**: Best used when you have a well-defined and relatively small number of partitions, and when data loading processes are predictable. It requires more upfront setup but can be more performant if partitions are well-managed.
* **Dynamic Partitioning**:  More flexible and less development effort, especially when dealing with data where partition values are not known in advance or are numerous. However, dynamic partitioning can be slower than static partitioning, and there are limits to the number of dynamic partitions that can be created (default is 100 per node). Exceeding this limit will result in an error.

### Insert Data into Partitioned Table

Let's see how to insert data into a dynamically partitioned table. Key points to remember:

1. Use the `INSERT INTO table PARTITION (partition_column)` syntax.
2. Ensure partition column values are provided last in the `VALUES` clause.

```sql
INSERT INTO test1.sales_partitioned_by_date PARTITION (sales_date)
VALUES 
(100001, 'UK', 2134562, 'String Tanbur', 1, 2389.99, '2020-04-20'),
(100002, 'USA', 2134563, 'Lackland Bass Quitar', 1, 1389.99, '2020-02-19'),
(100002, 'UK', 2134563, 'Lackland Bass Quitar', 1, 1389.99, '2020-02-19'),
(100004, 'TR', 2134563, 'Markbass Apmlifier', 1, 380.99, '2020-03-19'),
(100005, 'FR', 2133563, 'Drump Istanbul', 1, 889.99, '2020-04-11'),
(100006, 'UK', 2134563, 'Tamaha Bass Quitar', 1, 2359.99, '2020-04-14'),
(100007, 'USA', 2134513, 'Ibanez GRG170DX ', 1, 243.99, '2020-04-09'),
(100008, 'TR', 2134560, 'Yamaha ERG 121 GPII', 1, 248.99, '2020-04-03'),
(100009, 'UK', 2134569, 'Istanbul Samatya Cymbal Set', 1, 465.00, '2020-03-19'),
(100010, 'FR', 2134562, 'Zildjian K Cymbal Set', 1, 895.99, '2020-04-11');

select count(1) from test1.sales_partitioned_by_date;
```

```
+------+
| _c0  |
+------+
| 10   |
+------+
```

### List Partitions and Query Data

You can list the partitions of a Hive table in a few ways. One method is to directly look at the HDFS directory structure:

```bash
hdfs dfs -ls /user/hive/warehouse/test1.db/sales_partitioned_by_date
```

```
Found 7 items
drwxr-xr-x   - train hive          0 2020-11-02 22:53 /user/hive/warehouse/test1.db/sales_partitioned_by_date/sales_date=2020-02-19
drwxr-xr-x   - train hive          0 2020-11-02 22:53 /user/hive/warehouse/test1.db/sales_partitioned_by_date/sales_date=2020-03-19
drwxr-xr-x   - train hive          0 2020-11-02 22:53 /user/hive/warehouse/test1.db/sales_partitioned_by_date/sales_date=2020-04-03
drwxr-xr-x   - train hive          0 2020-11-02 22:53 /user/hive/warehouse/test1.db/sales_partitioned_by_date/sales_date=2020-04-09
drwxr-xr-x   - train hive          0 2020-11-02 22:53 /user/hive/warehouse/test1.db/sales_partitioned_by_date/sales_date=2020-04-11
drwxr-xr-x   - train hive          0 2020-11-02 22:53 /user/hive/warehouse/test1.db/sales_partitioned_by_date/sales_date=2020-04-14
drwxr-xr-x   - train hive          0 2020-11-02 22:53 /user/hive/warehouse/test1.db/sales_partitioned_by_date/sales_date=2020-04-20
```

Alternatively, you can use the Hive CLI command:

```sql
SHOW partitions test1.sales_partitioned_by_date;
```

```
sales_date=2020-02-19
sales_date=2020-03-19
sales_date=2020-04-03
sales_date=2020-04-09
sales_date=2020-04-11
sales_date=2020-04-14
sales_date=2020-04-20
```

To query data from a specific partition, you can include a `WHERE` clause that filters on the partition column:

```sql
SELECT * FROM test1.sales_partitioned_by_date WHERE sales_date = '2020-04-11' LIMIT 10;
```

## Bucketing

Bucketing is another data organization technique in Hive. While partitioning divides data into different directories, bucketing further divides data within partitions (or within a table if it's not partitioned) into multiple files called buckets.

Bucketing is beneficial for:

* **Improved query performance**:  Especially for queries involving joins and sampling.
* **Data organization**:  Data is pre-sorted and organized within each bucket.

To use bucketing, you must specify the number of buckets when creating the table and enable bucketing enforcement:

```sql
set hive.enforce.bucketing = true;
```

This setting ensures that Hive respects bucketing when writing data into the table.

## Partitioning + Bucketing Example

Let's dive into a practical example that demonstrates the combined power of partitioning and bucketing. In this example, we will use the MovieLens dataset to analyze movie ratings. Our business needs require us to efficiently query the most popular movies of a month with the lowest possible latency. To achieve this, we will create a Hive table that is both partitioned and bucketed.

### Download Datasets

First, we need to download the MovieLens datasets (`u.data` and `u.item`) from the provided URL using `wget` command:

```powershell
wget -O ~/datasets/u.data https://raw.githubusercontent.com/erkansirin78/datasets/master/ml-100k/u.data
wget -O ~/datasets/u.item https://raw.githubusercontent.com/erkansirin78/datasets/master/ml-100k/u.item
```

To understand the structure and delimiters of these datasets, we can use the `head` command:

```bash
[train@localhost ~]$ head ~/datasets/u.item
```

```
movieid|movietitle|releasedate|videoreleasedate|IMDbURL|unknown|Action|Adventure|Animation|Children's|Comedy|Crime|Documentary|Drama|Fantasy|Film-Noir|Horror|Musical|Mystery|Romance|Sci-Fi|Thriller|War|Western
1|ToyStory(1995)|01-Jan-1995||http://us.imdb.com/M/title-exact?Toy%20Story%20(1995)|0|0|0|1|1|1|0|0|0|0|0|0|0|0|0|0|0|0|0
...
```

```bash
[train@localhost ~]$ head ~/datasets/u.data
```

```
user_id item_id rating timestamp
196     242     3       881250949
186     302     3       891717742
...
```

Now, let's proceed to load these datasets into Hive tables. Start by launching the Beeline client and creating a database named `movielens`:

```sql
create database if not exists movielens;
```

### Load Data into Respective Hive Tables

First, we will load the `u.data` dataset into a Hive table named `ratings`.

#### Create Hive DB/Table and Load Data

To load the ratings data, we first create an external table `movielens.ratings` matching the structure of `u.data`.  Note that the delimiter is tab (`\t`) and we skip the header line.

```sql
create table if not exists movielens.ratings (user_id int, item_id int, rating int,  rating_time bigint)
row format delimited
fields terminated by '\t'
lines terminated by '\n'
stored as textfile
tblproperties('skip.header.line.count'='1');
```

Then, load the data from the local file system into the `movielens.ratings` table:

```sql
load data local inpath '/home/train/datasets/u.data' into table movielens.ratings;
```

Verify the data load by selecting a few rows and checking the total row count and distinct user count:

```sql
select * from movielens.ratings limit 4;
```

```
+------------------+------------------+-----------------+----------------------+
| ratings.user_id  | ratings.item_id  | ratings.rating  | ratings.rating_time  |
+------------------+------------------+-----------------+----------------------+
| 196              | 242              | 3               | 881250949            |
| 186              | 302              | 3               | 891717742            |
| 22               | 377              | 1               | 878887116            |
| 244              | 51               | 2               | 880606923            |
+------------------+------------------+-----------------+----------------------+
```

```sql
select count(1) from movielens.ratings;
```

```
+---------+
|   _c0   |
+---------+
| 100000  |
+---------+
```

```sql
select count(distinct user_id) from movielens.ratings;
```

```
+------+
| _c0  |
+------+
| 943  |
+------+
```

Next, load the `u.item` dataset into a Hive table named `movies`.

#### Create Hive DB/Table and Load Data

Create the `movies` table in the `movielens` database, matching the structure of `u.item`. Note that the delimiter is pipe (`|`) and we skip the header line.

```sql_more
create table if not exists  movielens.movies (
    movieid int,
    movietitle string,
    releasedate string,
    videoreleasedate string,
    IMDbURL string,
    unknown tinyint,
    Action tinyint,
    Adventure tinyint,
    Animation tinyint,
    Childrens tinyint,
    Comedy tinyint,
    Crime tinyint,
    Documentary tinyint,
    Drama tinyint,
    Fantasy tinyint,
    FilmNoir tinyint,
    Horror tinyint,
    Musical tinyint,
    Mystery tinyint,
    Romance tinyint,
    SciFi tinyint,
    Thriller tinyint,
    War tinyint,
    Western  tinyint)
    row format delimited
fields terminated by '|'
lines terminated by '\n'
stored as textfile
tblproperties('skip.header.line.count'='1');
```

Load data from the local file system into the `movielens.movies` table:

```sql_more
load data local inpath '/home/train/datasets/u.item' into table movielens.movies;
```

Verify the data load by selecting a few rows and checking the total row count:

```sql_more
select movieid, movietitle, releasedate from movielens.movies limit 5;
```

```
+----------+------------------+--------------+
| movieid  |    movietitle    | releasedate  |
+----------+------------------+--------------+
| 1        | ToyStory(1995)   | 01-Jan-1995  |
| 2        | GoldenEye(1995)  | 01-Jan-1995  |
| 3        | FourRooms(1995)  | 01-Jan-1995  |
| 4        | GetShorty(1995)  | 01-Jan-1995  |
| 5        | Copycat(1995)    | 01-Jan-1995  |
+----------+------------------+--------------+
```

```sql_more
select count(1) from movielens.movies;
```

```
+-------+
|  _c0  |
+-------+
| 1682  |
+-------+
```

Now that we have both `ratings` and `movies` data loaded into Hive, we can create our partitioned and bucketed table.

### Create Partitioned and Bucketed Hive Table

To efficiently query popular movies by month, create the `movielens.movie_ratings` table partitioned by `review_year` and `review_month`, and bucketed by `movietitle`:

```sql_more
create table if not exists movielens.movie_ratings (
user_id int,
rating int,
rating_time bigint,
movieid int,
movietitle string,
videoreleasedate string,
imdburl string)
partitioned by (review_year int, review_month int)
clustered by (movietitle) into 4 buckets
stored as orc;
```

Enable dynamic partitioning and bucketing for the data loading process:

```sql_more
set hive.exec.dynamic.partition=true;
set hive.exec.dynamic.partition.mode=nonstrict;
set hive.enforce.bucketing=true;
```

### Load Data into Partitioned & Bucketed Table by Joining Existing Hive Tables

Load data into the `movielens.movie_ratings` table by joining `movielens.ratings` and `movielens.movies` tables. The data will be dynamically partitioned by `review_year` and `review_month`:

```sql_more
insert overwrite table movielens.movie_ratings PARTITION(review_year, review_month)
select
    r.user_id,
    r.rating,
    r.rating_time,
    m.movieid,
    m.movietitle,
    m.videoreleasedate,
    m.imdburl,
    YEAR(from_unixtime(r.rating_time, 'yyyy-MM-dd')) as review_year,
    MONTH(from_unixtime(r.rating_time, 'yyyy-MM-dd')) as review_month
from movielens.ratings r join movielens.movies m on r.item_id = m.movieid;
```

### Perform Checks and Queries on Partitioned & Bucketed Final Hive Table

Verify the data loading and partitioning by checking the row count and listing partitions:

```sql_more
select count(1) from movielens.movie_ratings;
```

```
+---------+
|   _c0   |
+---------+
| 100000  |
+---------+
```

```sql_more
show partitions movielens.movie_ratings;
```

```
+-----------------------------------+
|             partition             |
+-----------------------------------+
| review_year=1997/review_month=10  |
| review_year=1997/review_month=11  |
| review_year=1997/review_month=12  |
| review_year=1997/review_month=9   |
| review_year=1998/review_month=1   |
| review_year=1998/review_month=2   |
| review_year=1998/review_month=3   |
| review_year=1998/review_month=4   |
+-----------------------------------+
```

To answer our business needs, let's run queries to find the top rated movies in April 1998.

#### Top rated counts movies in April 1998

Find the top 20 most rated movies in April 1998:

```sql_more
select  count(*) as total_count,  movietitle
from movielens.movie_ratings
where review_year=1998 AND review_month=4
group by movietitle order by total_count desc limit 20;
```

```
+--------------+------------------------------+
| total_count  |          movietitle          |
+--------------+------------------------------+
| 63           | Titanic(1997)                |
| 52           | AirForceOne(1997)            |
| 50           | Contact(1997)                |
| 49           | FullMonty,The(1997)          |
| 49           | StarWars(1977)               |
| 42           | GoodWillHunting(1997)        |
| 41           | LiarLiar(1997)               |
| 41           | EnglishPatient,The(1996)     |
| 39           | AsGoodAsItGets(1997)         |
| 39           | ConspiracyTheory(1997)       |
| 37           | Scream(1996)                 |
| 36           | ToyStory(1995)               |
| 36           | Fargo(1996)                  |
| 36           | ReturnoftheJedi(1983)        |
| 35           | L.A.Confidential(1997)       |
| 34           | ChasingAmy(1997)             |
| 34           | Godfather,The(1972)          |
| 33           | Braveheart(1995)             |
| 33           | StarshipTroopers(1997)       |
| 33           | SilenceoftheLambs,The(1991)  |
+--------------+------------------------------+
```

#### Top average rated movies in April 1998

Find the top 20 highest average rated movies in April 1998:

```sql_more
select avg(rating) as avg_rating, count(*) as total_count,  movietitle
from movielens.movie_ratings
where review_year=1998 AND review_month=4
group by movietitle order by avg_rating desc limit 20;
```

```
+-------------+--------------+-------------------------------------------+
| avg_rating  | total_count  |                movietitle                 |
+-------------+--------------+-------------------------------------------+
| 5.0         | 3            | CelluloidCloset,The(1995)                 |
| 5.0         | 1            | Boys,Les(1997)                            |
| 5.0         | 1            | Flirt(1995)                               |
| 5.0         | 1            | FreeWilly2:TheAdventureHome(1995)         |
| 5.0         | 1            | DeltaofVenus(1994)                        |
| 5.0         | 1            | CutthroatIsland(1995)                     |
| 5.0         | 1            | DunstonChecksIn(1996)                     |
| 5.0         | 2            | Diexueshuangxiong(Killer,The)(1989)       |
| 5.0         | 1            | Lassie(1994)                              |
| 5.0         | 1            | Innocents,The(1961)                       |
| 5.0         | 1            | Stalingrad(1993)                          |
| 5.0         | 1            | FearofaBlackHat(1993)                     |
| 5.0         | 1            | Trust(1990)                               |
| 5.0         | 1            | BoxingHelena(1993)                        |
| 5.0         | 1            | DavyCrockett,KingoftheWildFrontier(1955)  |
| 5.0         | 1            | BitterSugar(AzucarAmargo)(1996)           |
| 5.0         | 1            | BlueSky(1994)                             |
| 5.0         | 1            | Daylight(1996)                            |
| 5.0         | 2            | Prefontaine(1997)                         |
| 5.0         | 1            | 8Seconds(1994)                            |
+-------------+--------------+-------------------------------------------+
```

These queries demonstrate how partitioning by year and month and bucketing by movie title can help optimize data retrieval and analysis for time-based and movie-centric queries, aligning with our business requirements for low latency access to popular movie data.
