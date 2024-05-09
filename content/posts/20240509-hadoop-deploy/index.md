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
