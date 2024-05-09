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
