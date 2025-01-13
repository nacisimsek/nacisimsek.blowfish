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

If you directly opened this article without setting up your Docker environment, I suggest you visit that [article](https://nacisimsek.com/posts/20240509-hadoop-deploy/#deployment-of-the-cluster "Deployment of the Cluster") to deploy your cluster first.

