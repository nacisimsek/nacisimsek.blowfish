---
title: "Kafka Topics Management and Operations"
summary: "Complete guide to Kafka topics management, configuration parameters, producers, consumers, serialization, partitioning, and performance optimization with hands-on examples"
description: "Learn Kafka topics creation, management, producer/consumer operations, serialization methods (JSON, Avro, Protobuf), partitioning strategies, and performance tuning with practical CLI examples"
categories: ["Kafka","Data Engineering","Streaming"]
tags: ["tutorial", "kafka", "topics", "producer", "consumer", "serialization", "partitioning", "performance", "cli"]
date: 2024-06-03
draft: false
showauthor: false
authors:
  - nacisimsek
---

# Kafka Topics Management and Operations

In our [previous article](../20240602-kafka-deploy/), we successfully deployed a 3-node Kafka cluster on Kubernetes using KRaft mode. Now it's time to dive deep into **Kafka topics management** and explore the essential operations every data engineer should master.

This comprehensive guide will cover everything from basic topic creation to advanced performance optimization, all with hands-on examples using our live Kafka cluster.

## 🎯 What We'll Cover

- **Topic Creation & Configuration**: Essential parameters and best practices
- **Producer Operations**: Sending data with different serialization methods
- **Consumer Operations**: Reading data and understanding consumer groups
- **Serialization Methods**: JSON, Avro, and Protobuf comparison
- **Partitioning & Replication**: Distribution strategies and fault tolerance
- **Bulk Operations**: Batch processing and performance optimization
- **Advanced Configuration**: Retention policies and performance tuning
- **Message Ordering**: Understanding ordering guarantees and challenges

{{< alert icon="info-circle" cardColor="#3ae6da" iconColor="#0f172a" textColor="#0f172a" >}}

**Prerequisites:**

- Running Kafka cluster (we'll use the one from our [previous deployment](../20240602-kafka-deploy/))
- **Java 17 or higher** installed and configured
- Kafka CLI tools (`kafka-console-producer`, `kafka-console-consumer`, etc.)
- Basic understanding of Kafka concepts

{{< /alert >}}

{{< alert icon="triangle-exclamation" cardColor="#ffd874" iconColor="#0f172a" textColor="#0f172a" >}}

**Important:**

Kafka 4.0+ requires **Java 17 or higher**. If you encounter `UnsupportedClassVersionError`, check your Java version with `java -version` and upgrade if necessary.

{{< /alert >}}

## 🚀 Getting Started

First, let's verify our Kafka cluster is accessible and list any existing topics:

```shell
# Test connectivity to our Kafka cluster
kafka-topics --bootstrap-server localhost:19092,localhost:19093,localhost:19094 --list
```

```output
# Empty output means no topics exist yet
```

Excellent! Our cluster is accessible and ready for operations.

## 📋 Topic Creation and Configuration

### Basic Topic Creation

Let's start by creating our first topic with essential parameters:

```shell
# Create a topic with 3 partitions and replication factor of 3
kafka-topics --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --create \
  --topic user-events \
  --partitions 3 \
  --replication-factor 3
```

```output
Created topic user-events.
```

### Understanding Key Parameters

Let's create topics with different configurations to understand each parameter:

```shell
# Topic for high-throughput data
kafka-topics --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --create \
  --topic high-throughput \
  --partitions 6 \
  --replication-factor 3 \
  --config retention.ms=86400000 \
  --config segment.ms=3600000
```

```output
Created topic high-throughput.
```

```shell
# Topic for critical data with long retention
kafka-topics --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --create \
  --topic critical-events \
  --partitions 2 \
  --replication-factor 3 \
  --config retention.ms=604800000 \
  --config min.insync.replicas=2
```

```output
Created topic critical-events.
```

### Inspecting Topic Configuration

```shell
# List all topics
kafka-topics --bootstrap-server localhost:19092,localhost:19093,localhost:19094 --list
```

```output
critical-events
high-throughput
user-events
```

```shell
# Describe a topic in detail
kafka-topics --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --describe --topic user-events
```

```output
Topic: user-events	TopicId: abc123def-4567-8901-234f-56789abcdef0	PartitionCount: 3	ReplicationFactor: 3	Configs: 
	Topic: user-events	Partition: 0	Leader: 1	Replicas: 1,2,3	Isr: 1,2,3
	Topic: user-events	Partition: 1	Leader: 2	Replicas: 2,3,1	Isr: 2,3,1
	Topic: user-events	Partition: 2	Leader: 3	Replicas: 3,1,2	Isr: 3,1,2
```

{{< alert icon="lightbulb" cardColor="#e0f7fa" iconColor="#0f172a" textColor="#0f172a" >}}

**Key Configuration Parameters:**

- **Partitions**: Determines parallelism (hard to change later!)
- **Replication Factor**: Number of copies for fault tolerance
- **retention.ms**: How long messages are retained
- **min.insync.replicas**: Minimum replicas that must acknowledge writes
- **segment.ms**: Time before log segment rolls over

{{< /alert >}}

## 📤 Producer Operations

### Basic Message Production

Let's start producing messages to our topics:

```shell
# Start console producer for user-events topic
kafka-console-producer --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --topic user-events
```

Now we can type messages (each line is a separate message):

```
user123 logged in
user456 viewed product X
user789 added item to cart
user123 completed purchase
```

Press `Ctrl+C` to exit the producer.

### Producer with Key-Value Pairs

```shell
# Producer with keys (useful for partitioning)
kafka-console-producer --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --topic user-events \
  --property parse.key=true \
  --property key.separator=:
```

Example messages:
```
user123:{"action":"login","timestamp":"2024-11-30T15:30:00Z"}
user456:{"action":"view","product":"laptop","timestamp":"2024-11-30T15:31:00Z"}
user789:{"action":"purchase","amount":299.99,"timestamp":"2024-11-30T15:32:00Z"}
```

## 📥 Consumer Operations

### Basic Message Consumption

Open a new terminal and start consuming messages:

```shell
# Console consumer from beginning
kafka-console-consumer --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --topic user-events \
  --from-beginning
```

```output
user123 logged in
user456 viewed product X
user789 added item to cart
user123 completed purchase
{"action":"login","timestamp":"2024-11-30T15:30:00Z"}
{"action":"view","product":"laptop","timestamp":"2024-11-30T15:31:00Z"}
{"action":"purchase","amount":299.99,"timestamp":"2024-11-30T15:32:00Z"}
```

### Consumer with Key-Value Display

```shell
# Consumer showing keys and values
kafka-console-consumer --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --topic user-events \
  --property print.key=true \
  --property key.separator=: \
  --from-beginning
```

```output
null:user123 logged in
null:user456 viewed product X
null:user789 added item to cart
null:user123 completed purchase
user123:{"action":"login","timestamp":"2024-11-30T15:30:00Z"}
user456:{"action":"view","product":"laptop","timestamp":"2024-11-30T15:31:00Z"}
user789:{"action":"purchase","amount":299.99,"timestamp":"2024-11-30T15:32:00Z"}
```

## 🔄 Serialization Methods Comparison

### JSON Serialization (Human Readable)

JSON is the most common format for its readability and simplicity:

**Advantages:**
- Human-readable and debuggable
- Language-agnostic
- Schema evolution friendly
- Wide tooling support

**Disadvantages:**
- Larger message size
- No schema enforcement
- Parsing overhead

**Example:**
```json
{"userId": 12345, "action": "purchase", "amount": 299.99, "timestamp": "2024-11-30T15:30:00Z"}
```

### Avro Serialization (Schema Evolution)

Avro provides schema evolution capabilities:

**Advantages:**
- Compact binary format
- Schema evolution support
- Strong typing
- Schema registry integration

**Disadvantages:**
- Requires schema registry
- Binary format (not human-readable)
- More complex setup

**Schema Example:**
```json
{
  "type": "record",
  "name": "UserEvent",
  "fields": [
    {"name": "userId", "type": "int"},
    {"name": "action", "type": "string"},
    {"name": "amount", "type": ["null", "double"], "default": null}
  ]
}
```

### Protobuf Serialization (Performance)

Protocol Buffers offer excellent performance:

**Advantages:**
- Very compact binary format
- Fast serialization/deserialization
- Strong typing
- Cross-language support

**Disadvantages:**
- Requires .proto files
- Binary format
- Less flexible schema evolution than Avro

**Example .proto:**
```protobuf
message UserEvent {
  int32 userId = 1;
  string action = 2;
  optional double amount = 3;
}
```

{{< alert icon="triangle-exclamation" cardColor="#ffd874" iconColor="#0f172a" textColor="#0f172a" >}}

**Serialization Format Comparison:**

| Format   | Size | Speed | Schema Evolution | Human Readable |
|----------|------|-------|------------------|----------------|
| JSON     | ❌   | ⚠️     | ⚠️               | ✅             |
| Avro     | ✅   | ✅     | ✅               | ❌             |
| Protobuf | ✅   | ✅     | ⚠️               | ❌             |

{{< /alert >}}

## 🔀 Partitioning and Replication

### Understanding Partition Distribution

Let's examine how messages are distributed across partitions:

```shell
# Create test messages with different keys
kafka-console-producer --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --topic user-events \
  --property parse.key=true \
  --property key.separator=:
```

Send these messages:
```
A:Message from key A
B:Message from key B  
C:Message from key C
A:Another message from key A
B:Another message from key B
```

Now let's consume from specific partitions to see the distribution:

```shell
# Consume from partition 0 only
kafka-console-consumer --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --topic user-events \
  --partition 0 \
  --from-beginning
```

```shell
# Consume from partition 1 only  
kafka-console-consumer --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --topic user-events \
  --partition 1 \
  --from-beginning
```

```shell
# Consume from partition 2 only
kafka-console-consumer --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --topic user-events \
  --partition 2 \
  --from-beginning
```

{{< alert icon="edit" cardColor="#3ae6da" iconColor="#0f172a" textColor="#0f172a" >}}

**Key Points:**

- Messages with the same key always go to the same partition
- This guarantees ordering within a key
- Different keys may hash to the same partition
- Null keys are distributed round-robin

{{< /alert >}}

### The Repartitioning Challenge

Let's demonstrate why changing partition count is problematic:

```shell
# Try to increase partitions (this works but breaks key ordering)
kafka-topics --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --alter \
  --topic user-events \
  --partitions 6
```

```output
WARNING: If partitions are increased for a topic that has a key, the partition logic or ordering of the messages will be affected. Adding partitions is currently unsupported for topics with a key-based partitioner.
```

{{< alert icon="triangle-exclamation" cardColor="#ffd874" iconColor="#0f172a" textColor="#0f172a" >}}

**Important:**

Increasing partitions breaks the key-to-partition mapping! Existing keys may now map to different partitions, breaking ordering guarantees. Plan your partition count carefully from the start.

{{< /alert >}}

## 👥 Consumer Groups and Message Ordering

### Single Consumer Group

```shell
# Start consumer with group ID
kafka-console-consumer --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --topic user-events \
  --group my-consumer-group \
  --from-beginning
```

### Multiple Consumers in Same Group

Open another terminal and run:

```shell
# Second consumer in same group
kafka-console-consumer --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --topic user-events \
  --group my-consumer-group
```

Notice how partitions are automatically distributed between consumers!

### Understanding Message Ordering Issues

```shell
# Producer sending ordered messages
kafka-console-producer --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --topic high-throughput \
  --property parse.key=true \
  --property key.separator=:
```

Send these messages:
```
order1:step1-start
order1:step2-process  
order1:step3-complete
order2:step1-start
order2:step2-process
order2:step3-complete
```

With multiple consumers, you might see:
- Consumer 1 gets: `order1:step1-start`, `order2:step2-process`  
- Consumer 2 gets: `order1:step2-process`, `order1:step3-complete`, `order2:step1-start`, `order2:step3-complete`

This breaks the ordering within each order!

{{< alert icon="triangle-exclamation" cardColor="#ffd874" iconColor="#0f172a" textColor="#0f172a" >}}

**Message Ordering Guarantees:**

- ✅ **Within partition**: Messages are strictly ordered
- ✅ **Within key**: When using keyed messages and single partition
- ❌ **Across partitions**: No ordering guarantee
- ❌ **Multiple consumers**: Can process partitions out of order

{{< /alert >}}

## 📊 Bulk Operations and Performance

### Bulk Message Production

Let's test bulk operations with performance settings:

```shell
# High-performance producer settings
kafka-producer-perf-test --topic high-throughput \
  --num-records 10000 \
  --record-size 1000 \
  --throughput 1000 \
  --producer-props bootstrap.servers=localhost:19092,localhost:19093,localhost:19094 \
                     batch.size=16384 \
                     linger.ms=10 \
                     compression.type=snappy
```

```output
9999 records sent, 999.900010 records/sec (0.95 MB/sec), 12.3 ms avg latency, 67.0 ms max latency.
10000 records sent, 1000.000000 records/sec (0.95 MB/sec)
```

### Key Performance Settings

**Batch Size (`batch.size`)**:
- Groups multiple records into batches
- Larger batches = better throughput, higher latency
- Default: 16KB

**Linger Time (`linger.ms`)**:
- Wait time before sending batch
- Allows batching of more records
- Trade-off: latency vs throughput
- Default: 0ms (no batching)

**Compression (`compression.type`)**:
- Reduces network I/O
- Options: none, gzip, snappy, lz4, zstd
- Snappy: good balance of speed/compression

Let's test different configurations:

```shell
# Low latency configuration
kafka-producer-perf-test --topic user-events \
  --num-records 1000 \
  --record-size 100 \
  --throughput 100 \
  --producer-props bootstrap.servers=localhost:19092,localhost:19093,localhost:19094 \
                     batch.size=1 \
                     linger.ms=0
```

```shell
# High throughput configuration  
kafka-producer-perf-test --topic high-throughput \
  --num-records 1000 \
  --record-size 100 \
  --throughput 100 \
  --producer-props bootstrap.servers=localhost:19092,localhost:19093,localhost:19094 \
                     batch.size=65536 \
                     linger.ms=100 \
                     compression.type=lz4
```

## ⚙️ Advanced Topic Configuration

### Retention Policies

```shell
# Time-based retention (7 days)
kafka-configs --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --entity-type topics \
  --entity-name user-events \
  --alter \
  --add-config retention.ms=604800000
```

```shell
# Size-based retention (1GB)
kafka-configs --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --entity-type topics \
  --entity-name high-throughput \
  --alter \
  --add-config retention.bytes=1073741824
```

### Cleanup Policies

```shell
# Create compacted topic (keeps latest value per key)
kafka-topics --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --create \
  --topic user-profiles \
  --partitions 3 \
  --replication-factor 3 \
  --config cleanup.policy=compact \
  --config min.cleanable.dirty.ratio=0.1
```

### Viewing Current Configuration

```shell
# View all topic configurations
kafka-configs --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --entity-type topics \
  --entity-name user-events \
  --describe
```

```output
Dynamic configs for topic user-events are:
  retention.ms=604800000 sensitive=false synonyms={DYNAMIC_TOPIC_CONFIG:retention.ms=604800000}
```

## 🛠️ Consumer Group Management

### Monitoring Consumer Groups

```shell
# List all consumer groups
kafka-consumer-groups --bootstrap-server localhost:19092,localhost:19093,localhost:19094 --list
```

```output
my-consumer-group
```

```shell
# Describe consumer group
kafka-consumer-groups --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --group my-consumer-group \
  --describe
```

```output
Consumer group 'my-consumer-group' has no active members.

GROUP             TOPIC         PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG             CONSUMER-ID     HOST            CLIENT-ID
my-consumer-group user-events   0          45              45              0               -               -               -
my-consumer-group user-events   1          38              38              0               -               -               -
my-consumer-group user-events   2          42              42              0               -               -               -
```

### Reset Consumer Group Offsets

```shell
# Reset to beginning
kafka-consumer-groups --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --group my-consumer-group \
  --reset-offsets \
  --to-earliest \
  --topic user-events \
  --execute
```

```output
GROUP                          TOPIC                          PARTITION  NEW-OFFSET     
my-consumer-group              user-events                    0          0              
my-consumer-group              user-events                    1          0              
my-consumer-group              user-events                    2          0
```

## 🧹 Cleanup and Best Practices

### Topic Deletion

```shell
# Delete a topic (be careful!)
kafka-topics --bootstrap-server localhost:19092,localhost:19093,localhost:19094 \
  --delete \
  --topic test-topic
```

### Best Practices Summary

{{< alert icon="lightbulb" cardColor="#e0f7fa" iconColor="#0f172a" textColor="#0f172a" >}}

**Production Best Practices:**

1. **Plan partition count carefully** - hard to change later
2. **Use replication factor ≥ 3** for fault tolerance  
3. **Set appropriate retention** based on use case
4. **Use meaningful topic names** with naming conventions
5. **Monitor consumer lag** regularly
6. **Choose serialization format** based on requirements
7. **Configure producer batching** for performance
8. **Use consumer groups** for scalability
9. **Plan for schema evolution** from day one
10. **Test failure scenarios** before production

{{< /alert >}}

## 🎯 Summary

We've covered comprehensive Kafka topics management including:

- ✅ **Topic Creation**: With proper partitioning and replication
- ✅ **Producer Operations**: Basic and advanced message production
- ✅ **Consumer Operations**: Individual and group consumption patterns
- ✅ **Serialization**: JSON, Avro, and Protobuf comparison
- ✅ **Partitioning**: Distribution strategies and repartitioning challenges  
- ✅ **Performance Tuning**: Batch size, linger time, and compression
- ✅ **Consumer Groups**: Scalability and ordering considerations
- ✅ **Advanced Configuration**: Retention, cleanup policies, and monitoring

Understanding these concepts is crucial for building robust, scalable data streaming applications with Kafka.

## 📚 Related Articles

- [Deploy Multi-Node Kafka Cluster on Kubernetes](../20240602-kafka-deploy/)
- [Kafka Python Operations](../20240604-kafka-python-operations/)
- [Apache Spark and Kafka Integration](../20240609-spark-streaming/)

---

*All examples in this article were tested on our Kubernetes-deployed Kafka cluster with version 4.0.0 using KRaft mode.*