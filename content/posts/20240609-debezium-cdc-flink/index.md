---
title: "Change Data Capture (CDC) Pipeline Implementation"
summary: "This article is about how to deploy Hive services on Hadoop Cluster, which components it has, how the data is stored and managed in Hive, how the calculation is done via MapReduce, and how Yarn manage the resources"
description: "This article is about how to deploy Hive services on Hadoop Cluster, which components it has, how the data is stored and managed in Hive, how the calculation is done via MapReduce, and how Yarn manage the resources"
categories: ["Docker","Hadoop","Data Engineering"]
tags: ["tutorial", "hdfs", "hive", "mapreduce", "postgres", "catalog"]
date: 2024-06-09
draft: false
showauthor: false
authors:
  - nacisimsek
---
# Change Data Capture (CDC) Pipeline Implementation

In this article, we will be implementing a pipeline with PostgreSQL, Debezium CDC, Kafka, MinIO and the Spark.

