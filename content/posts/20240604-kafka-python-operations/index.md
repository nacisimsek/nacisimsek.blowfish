---
title: "Kafka Python Operations and Data Streaming"
summary: "Complete guide to Kafka Python operations including producers, consumers, data generators, real-world datasets, consumer groups, and advanced streaming patterns with confluent-kafka library"
description: "Learn Kafka Python operations with confluent-kafka library, data generators, CSV streaming, consumer groups, partition management, and practical examples using real datasets"
categories: ["Kafka","Python","Data Engineering","Streaming"]
tags: ["tutorial", "kafka", "python", "confluent-kafka", "streaming", "consumer-groups", "data-generator", "csv"]
date: 2024-06-04
draft: false
showauthor: false
authors:
  - nacisimsek
---

# Kafka Python Operations and Data Streaming

In our [previous articles](../20240603-kafka-topics/), we explored Kafka topics management using CLI tools. Now it's time to dive into **Python-based Kafka operations** - the backbone of modern data streaming applications.

This comprehensive guide will show you how to build robust Kafka producers and consumers in Python, work with real datasets, manage consumer groups, and implement advanced streaming patterns using the `confluent-kafka` library.

## 🎯 What We'll Build

- **Python Producers**: Send data to Kafka topics with proper error handling
- **Python Consumers**: Read and process streaming data efficiently
- **Data Generators**: Stream CSV datasets to Kafka topics
- **Consumer Groups**: Scale data processing across multiple consumers
- **Real-world Examples**: Turkish regions dataset and customer churn analysis
- **Advanced Patterns**: Callbacks, serialization, and monitoring

{{< alert icon="info-circle" cardColor="#3ae6da" iconColor="#0f172a" textColor="#0f172a" >}}

**Prerequisites:**

- Running Kafka cluster (from our [deployment guide](../20240602-kafka-deploy/))
- **Python 3.8 or higher** installed
- Basic understanding of Kafka concepts (topics, partitions, consumer groups)
- **Java 17+** for Kafka CLI tools

{{< /alert >}}

## 🐍 Python Environment Setup

### Setting Up Virtual Environment

Let's start by creating a dedicated Python environment for our Kafka operations:

```shell
# Create project directory
mkdir kafka-python-demo
cd kafka-python-demo

# Create virtual environment
python3 -m venv kafka-env

# Activate virtual environment
source kafka-env/bin/activate  # Linux/Mac
# kafka-env\Scripts\activate  # Windows
```

### Installing Required Packages

```shell
# Install confluent-kafka library
pip install confluent-kafka pandas requests

# Create requirements.txt for future use
cat > requirements.txt << EOF
confluent-kafka>=2.3.0
pandas>=2.0.0
requests>=2.31.0
EOF
```

{{< alert icon="lightbulb" cardColor="#e0f7fa" iconColor="#0f172a" textColor="#0f172a" >}}

**Why confluent-kafka?**

The `confluent-kafka` library is the most robust Python Kafka client, offering:
- High performance C/C++ backend (librdkafka)
- Advanced features like exactly-once semantics
- Excellent error handling and monitoring
- Production-ready reliability

{{< /alert >}}

## 📤 Building Python Producers

### Basic Configuration

First, let's create a configuration module for our Kafka connection:

```python
# config.py
config = {
    'bootstrap.servers': 'localhost:19092,localhost:19093,localhost:19094',
    'client.id': 'python-kafka-demo'
}

# Producer-specific configuration
producer_config = {
    **config,
    'acks': 'all',
    'retries': 3,
    'retry.backoff.ms': 100,
    'linger.ms': 10,
    'batch.size': 16384,
    'compression.type': 'snappy'
}

# Consumer-specific configuration  
consumer_config = {
    **config,
    'group.id': 'python-demo-group',
    'auto.offset.reset': 'earliest',
    'enable.auto.commit': False,
    'max.poll.interval.ms': 300000
}
```

### Simple Producer Example

```python
# simple_producer.py
from confluent_kafka import Producer
from config import producer_config
import json
import time

def delivery_callback(err, msg):
    """Callback function for delivery reports"""
    if err is not None:
        print(f'Message delivery failed: {err}')
    else:
        print(f'Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}')

def create_producer():
    """Create and return a Kafka producer"""
    return Producer(producer_config)

def send_simple_message(producer, topic, key, value):
    """Send a simple key-value message"""
    try:
        producer.produce(
            topic=topic,
            key=str(key),
            value=value,
            on_delivery=delivery_callback
        )
        producer.poll(0)  # Trigger delivery callbacks
    except Exception as e:
        print(f"Error producing message: {e}")

if __name__ == "__main__":
    producer = create_producer()
    
    # Send sample messages
    messages = [
        ("user-events", "user123", "User logged in"),
        ("user-events", "user456", "User viewed product"),
        ("user-events", "user789", "User made purchase")
    ]
    
    for topic, key, value in messages:
        send_simple_message(producer, topic, key, value)
    
    # Ensure all messages are delivered
    producer.flush()
    print("All messages sent successfully!")
```

### Advanced Producer with JSON Serialization

```python
# json_producer.py
from confluent_kafka import Producer
from config import producer_config
import json
from datetime import datetime
import uuid

class KafkaJSONProducer:
    def __init__(self, config):
        self.producer = Producer(config)
        
    def delivery_callback(self, err, msg):
        """Enhanced callback with error handling"""
        if err is not None:
            print(f'❌ Message delivery failed: {err}')
        else:
            print(f'✅ Message delivered to {msg.topic()}[{msg.partition()}] @ {msg.offset()}')
    
    def send_json_message(self, topic, key, data, headers=None):
        """Send JSON-serialized message with optional headers"""
        try:
            # Add metadata
            message = {
                'id': str(uuid.uuid4()),
                'timestamp': datetime.now().isoformat(),
                'data': data
            }
            
            self.producer.produce(
                topic=topic,
                key=str(key),
                value=json.dumps(message),
                headers=headers or {},
                on_delivery=self.delivery_callback
            )
            
            # Process delivery callbacks
            self.producer.poll(0)
            
        except Exception as e:
            print(f"❌ Error producing message: {e}")
    
    def close(self):
        """Flush and close producer"""
        self.producer.flush()

# Usage example
if __name__ == "__main__":
    producer = KafkaJSONProducer(producer_config)
    
    # Sample e-commerce events
    events = [
        {
            "user_id": "12345",
            "action": "login", 
            "ip_address": "192.168.1.100"
        },
        {
            "user_id": "12345",
            "action": "view_product",
            "product_id": "laptop-123",
            "category": "electronics"
        },
        {
            "user_id": "12345", 
            "action": "add_to_cart",
            "product_id": "laptop-123",
            "quantity": 1,
            "price": 999.99
        }
    ]
    
    for i, event in enumerate(events):
        headers = {"source": "web-app", "version": "1.0"}
        producer.send_json_message("user-events", event["user_id"], event, headers)
        time.sleep(0.5)  # Simulate real-time events
    
    producer.close()
    print("JSON producer demo completed!")
```

## 📥 Building Python Consumers

### Basic Consumer Implementation

```python
# simple_consumer.py
from confluent_kafka import Consumer, KafkaError
from config import consumer_config
import json

class SimpleKafkaConsumer:
    def __init__(self, config, topics):
        self.consumer = Consumer(config)
        self.consumer.subscribe(topics)
        
    def consume_messages(self, max_messages=None):
        """Consume messages with proper error handling"""
        try:
            message_count = 0
            while True:
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    continue
                    
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        print(f'End of partition reached {msg.topic()}[{msg.partition()}]')
                    else:
                        print(f'Error: {msg.error()}')
                    continue
                
                # Process message
                self.process_message(msg)
                message_count += 1
                
                # Commit offset
                self.consumer.commit(msg)
                
                if max_messages and message_count >= max_messages:
                    break
                    
        except KeyboardInterrupt:
            print("Consumer interrupted by user")
        finally:
            self.consumer.close()
    
    def process_message(self, msg):
        """Process individual message"""
        try:
            key = msg.key().decode('utf-8') if msg.key() else None
            value = msg.value().decode('utf-8') if msg.value() else None
            
            print(f"Key: {key}")
            print(f"Value: {value}")
            print(f"Partition: {msg.partition()}")
            print(f"Offset: {msg.offset()}")
            print(f"Timestamp: {msg.timestamp()}")
            print("-" * 50)
            
        except Exception as e:
            print(f"Error processing message: {e}")

# Usage
if __name__ == "__main__":
    # Update consumer config with unique group ID
    config = {**consumer_config, 'group.id': 'simple-consumer-group'}
    
    consumer = SimpleKafkaConsumer(config, ['user-events'])
    print("Starting consumer... Press Ctrl+C to stop")
    consumer.consume_messages()
```

### Advanced Consumer with JSON Processing

```python
# json_consumer.py  
from confluent_kafka import Consumer, KafkaError
from config import consumer_config
import json
from datetime import datetime

class JSONKafkaConsumer:
    def __init__(self, config, topics):
        self.consumer = Consumer(config)
        self.consumer.subscribe(topics)
        self.message_count = 0
        
    def consume_and_process(self):
        """Consume and process JSON messages"""
        try:
            while True:
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    continue
                    
                if msg.error():
                    self.handle_error(msg.error())
                    continue
                
                # Process JSON message
                self.process_json_message(msg)
                
                # Manual commit for better control
                self.consumer.commit(msg)
                
        except KeyboardInterrupt:
            print("\n🛑 Consumer stopped by user")
        finally:
            self.close()
    
    def process_json_message(self, msg):
        """Process JSON message with error handling"""
        try:
            self.message_count += 1
            
            # Decode message
            key = msg.key().decode('utf-8') if msg.key() else None
            raw_value = msg.value().decode('utf-8')
            
            # Parse JSON
            json_data = json.loads(raw_value)
            
            # Extract headers if present
            headers = {k: v.decode('utf-8') if isinstance(v, bytes) else v 
                      for k, v in (msg.headers() or [])}
            
            print(f"📨 Message #{self.message_count}")
            print(f"🔑 Key: {key}")
            print(f"📄 JSON Data: {json.dumps(json_data, indent=2)}")
            print(f"📊 Partition: {msg.partition()} | Offset: {msg.offset()}")
            print(f"⏰ Timestamp: {datetime.fromtimestamp(msg.timestamp()[1]/1000)}")
            
            if headers:
                print(f"📝 Headers: {headers}")
            
            print("=" * 60)
            
            # Business logic based on message content
            self.handle_business_logic(json_data)
            
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in message: {e}")
        except Exception as e:
            print(f"❌ Error processing message: {e}")
    
    def handle_business_logic(self, data):
        """Handle business logic based on message data"""
        if 'data' in data and 'action' in data['data']:
            action = data['data']['action']
            
            if action == 'login':
                print("🟢 User login event processed")
            elif action == 'view_product':
                print(f"👀 Product view: {data['data'].get('product_id', 'unknown')}")
            elif action == 'add_to_cart':
                print(f"🛒 Added to cart: {data['data'].get('quantity', 0)} items")
            elif action == 'purchase':
                print(f"💰 Purchase completed: ${data['data'].get('amount', 0)}")
    
    def handle_error(self, error):
        """Handle consumer errors"""
        if error.code() == KafkaError._PARTITION_EOF:
            print("📄 Reached end of partition")
        else:
            print(f"❌ Consumer error: {error}")
    
    def close(self):
        """Close consumer connection"""
        self.consumer.close()
        print(f"📊 Total messages processed: {self.message_count}")

# Usage
if __name__ == "__main__":
    config = {**consumer_config, 'group.id': 'json-processor-group'}
    
    consumer = JSONKafkaConsumer(config, ['user-events'])
    print("🚀 Starting JSON consumer... Press Ctrl+C to stop")
    consumer.consume_and_process()
```

## 🗂️ Working with Real Datasets

### Turkish Regions Producer Example

Based on your homework, let's create a producer for Turkish geographical regions:

```python
# regions_producer.py
from confluent_kafka import Producer
from config import producer_config
import time

def delivery_callback(err, msg):
    """Callback for delivery confirmation"""
    if err is not None:
        print(f'❌ Delivery failed for {msg.key()}: {err}')
    else:
        key = msg.key().decode('utf-8') if msg.key() else None
        value = msg.value().decode('utf-8') if msg.value() else None
        print(f'✅ {value} sent to partition {msg.partition()}')

def send_turkish_regions():
    """Send Turkish geographical regions to Kafka"""
    
    # First, create the topic
    import subprocess
    create_topic_cmd = [
        'kafka-topics', 
        '--bootstrap-server', 'localhost:19092,localhost:19093,localhost:19094',
        '--create', 
        '--topic', 'turkish-regions',
        '--partitions', '3',
        '--replication-factor', '3'
    ]
    
    try:
        result = subprocess.run(create_topic_cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Topic 'turkish-regions' created successfully")
        else:
            print(f"ℹ️  Topic might already exist: {result.stderr}")
    except Exception as e:
        print(f"⚠️  Could not create topic: {e}")
    
    # Initialize producer
    producer = Producer(producer_config)
    
    # Turkish regions with their keys
    regions = {
        1: 'Marmara',
        2: 'Ege', 
        3: 'Akdeniz',
        4: 'İç Anadolu',
        5: 'Karadeniz',
        6: 'Doğu Anadolu',
        7: 'Güneydoğu Anadolu'
    }
    
    print("🇹🇷 Sending Turkish regions to Kafka...")
    
    # Send each region
    for key, region in regions.items():
        producer.produce(
            topic='turkish-regions',
            key=str(key),
            value=region,
            on_delivery=delivery_callback
        )
        
        # Process delivery callbacks
        producer.poll(0)
        time.sleep(0.5)  # Small delay for demonstration
    
    # Ensure all messages are sent
    producer.flush()
    print("🎉 All regions sent successfully!")

if __name__ == "__main__":
    send_turkish_regions()
```

### Regions Consumer with Custom Output

```python
# regions_consumer.py
from confluent_kafka import Consumer, KafkaError
from config import consumer_config
from datetime import datetime

def consume_turkish_regions():
    """Consume Turkish regions with custom formatting"""
    
    # Consumer configuration
    config = {
        **consumer_config,
        'group.id': 'turkish-regions-group',
        'auto.offset.reset': 'earliest'
    }
    
    consumer = Consumer(config)
    consumer.subscribe(['turkish-regions'])
    
    print("🇹🇷 Turkish Regions Consumer Started")
    print("Format: Key: X, Value: Region, Partition: Y, TS: timestamp")
    print("=" * 60)
    
    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            
            if msg is None:
                continue
                
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(f"❌ Error: {msg.error()}")
                    break
            
            # Extract message details
            key = msg.key().decode('utf-8') if msg.key() else None
            value = msg.value().decode('utf-8') if msg.value() else None
            partition = msg.partition()
            timestamp = msg.timestamp()[1]  # Get timestamp in milliseconds
            
            # Format output as requested in homework
            print(f"Key: {key}, Value: {value}, Partition: {partition}, TS: {timestamp}")
            
            # Commit the message
            consumer.commit(msg)
            
    except KeyboardInterrupt:
        print("\n🛑 Consumer stopped")
    finally:
        consumer.close()

if __name__ == "__main__":
    consume_turkish_regions()
```

## 📊 Data Generator for CSV Datasets

Now let's implement a data generator similar to your homework for streaming CSV data:

### CSV to Kafka Stream Producer

```python
# csv_streamer.py
from confluent_kafka import Producer
from config import producer_config
import pandas as pd
import json
import time
import argparse
from datetime import datetime

class CSVKafkaStreamer:
    def __init__(self, config):
        self.producer = Producer(config)
        self.total_sent = 0
        
    def delivery_callback(self, err, msg):
        """Callback for delivery reports"""
        if err is not None:
            print(f'❌ Message delivery failed: {err}')
        else:
            self.total_sent += 1
            if self.total_sent % 100 == 0:
                print(f'📊 Sent {self.total_sent} messages...')
    
    def stream_csv_to_kafka(self, csv_file, topic, key_column, rate_limit=10):
        """Stream CSV file to Kafka topic"""
        
        print(f"📁 Loading CSV file: {csv_file}")
        
        try:
            # Read CSV file
            df = pd.read_csv(csv_file)
            print(f"📊 Loaded {len(df)} records")
            print(f"📋 Columns: {list(df.columns)}")
            
            if key_column not in df.columns:
                raise ValueError(f"Key column '{key_column}' not found in CSV")
            
            # Calculate delay based on rate limit
            delay = 1.0 / rate_limit if rate_limit > 0 else 0
            
            print(f"🚀 Starting to stream to topic '{topic}' (rate: {rate_limit}/sec)")
            print("Press Ctrl+C to stop streaming")
            
            start_time = time.time()
            
            # Stream each row
            for index, row in df.iterrows():
                try:
                    # Use specified column as key
                    key = str(row[key_column])
                    
                    # Convert row to JSON (excluding the key column from value)
                    value_data = row.to_dict()
                    
                    # Create message with metadata
                    message = {
                        'row_number': index + 1,
                        'timestamp': datetime.now().isoformat(),
                        'data': value_data
                    }
                    
                    # Send to Kafka
                    self.producer.produce(
                        topic=topic,
                        key=key,
                        value=json.dumps(message),
                        on_delivery=self.delivery_callback
                    )
                    
                    # Poll for delivery callbacks
                    self.producer.poll(0)
                    
                    # Rate limiting
                    if delay > 0:
                        time.sleep(delay)
                        
                except Exception as e:
                    print(f"❌ Error processing row {index}: {e}")
                    continue
            
            # Flush remaining messages
            self.producer.flush()
            
            elapsed = time.time() - start_time
            print(f"\n🎉 Streaming completed!")
            print(f"📊 Total records sent: {self.total_sent}")
            print(f"⏱️  Time elapsed: {elapsed:.2f} seconds")
            print(f"📈 Average rate: {self.total_sent/elapsed:.2f} records/sec")
            
        except Exception as e:
            print(f"❌ Error streaming CSV: {e}")

def download_sample_dataset():
    """Download sample dataset for demonstration"""
    import requests
    
    url = "https://raw.githubusercontent.com/erkansirin78/datasets/master/Churn_Modelling.csv"
    filename = "Churn_Modelling.csv"
    
    print(f"📥 Downloading sample dataset from: {url}")
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        with open(filename, 'w') as f:
            f.write(response.text)
        
        print(f"✅ Dataset saved as: {filename}")
        return filename
        
    except Exception as e:
        print(f"❌ Error downloading dataset: {e}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Stream CSV data to Kafka')
    parser.add_argument('--input', required=True, help='Path to CSV file')
    parser.add_argument('--topic', required=True, help='Kafka topic name')
    parser.add_argument('--key-column', '-k', required=True, help='Column to use as message key')
    parser.add_argument('--rate', '-r', type=int, default=10, help='Messages per second (0 for unlimited)')
    parser.add_argument('--download-sample', action='store_true', help='Download sample dataset')
    
    args = parser.parse_args()
    
    # Download sample dataset if requested
    if args.download_sample:
        csv_file = download_sample_dataset()
        if csv_file is None:
            exit(1)
        args.input = csv_file
    
    # Create topic first
    import subprocess
    create_topic_cmd = [
        'kafka-topics',
        '--bootstrap-server', 'localhost:19092,localhost:19093,localhost:19094', 
        '--create',
        '--topic', args.topic,
        '--partitions', '3',
        '--replication-factor', '3'
    ]
    
    try:
        subprocess.run(create_topic_cmd, capture_output=True, text=True, check=True)
        print(f"✅ Topic '{args.topic}' created successfully")
    except subprocess.CalledProcessError:
        print(f"ℹ️  Topic '{args.topic}' might already exist")
    
    # Start streaming
    streamer = CSVKafkaStreamer(producer_config)
    
    try:
        streamer.stream_csv_to_kafka(
            csv_file=args.input,
            topic=args.topic, 
            key_column=args.key_column,
            rate_limit=args.rate
        )
    except KeyboardInterrupt:
        print("\n🛑 Streaming stopped by user")
```

## 👥 Consumer Groups in Action

Let's create multiple consumers to demonstrate consumer group behavior:

### Multi-Consumer Group Demo

```python
# consumer_group_demo.py
from confluent_kafka import Consumer, KafkaError
from config import consumer_config
import json
import threading
import time
from datetime import datetime

class GroupedConsumer:
    def __init__(self, consumer_id, group_id, topics, process_time=0.1):
        self.consumer_id = consumer_id
        self.config = {
            **consumer_config,
            'group.id': group_id,
            'client.id': f'{group_id}-consumer-{consumer_id}'
        }
        
        self.consumer = Consumer(self.config)
        self.consumer.subscribe(topics)
        self.process_time = process_time
        self.running = True
        self.message_count = 0
        
    def start_consuming(self):
        """Start consuming messages in a separate thread"""
        thread = threading.Thread(target=self._consume_loop, daemon=True)
        thread.start()
        return thread
    
    def _consume_loop(self):
        """Main consumer loop"""
        print(f"🚀 Consumer {self.consumer_id} started")
        
        try:
            while self.running:
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    continue
                    
                if msg.error():
                    if msg.error().code() != KafkaError._PARTITION_EOF:
                        print(f"❌ Consumer {self.consumer_id} error: {msg.error()}")
                    continue
                
                # Process message
                self._process_message(msg)
                
                # Simulate processing time
                time.sleep(self.process_time)
                
                # Commit offset
                self.consumer.commit(msg)
                
        except Exception as e:
            print(f"❌ Consumer {self.consumer_id} exception: {e}")
        finally:
            self.consumer.close()
            print(f"🛑 Consumer {self.consumer_id} stopped (processed {self.message_count} messages)")
    
    def _process_message(self, msg):
        """Process individual message"""
        self.message_count += 1
        
        try:
            key = msg.key().decode('utf-8') if msg.key() else None
            value = msg.value().decode('utf-8') if msg.value() else None
            
            # Try to parse JSON
            try:
                data = json.loads(value)
                display_value = data.get('data', {}).get('CustomerId', value[:50])
            except:
                display_value = value[:50]  # Show first 50 chars
            
            timestamp = datetime.fromtimestamp(msg.timestamp()[1]/1000).strftime('%H:%M:%S')
            
            print(f"🔵 Consumer-{self.consumer_id} | Key: {key} | Value: {display_value}... | "
                  f"Partition: {msg.partition()} | Time: {timestamp}")
            
        except Exception as e:
            print(f"❌ Consumer {self.consumer_id} processing error: {e}")
    
    def stop(self):
        """Stop consumer"""
        self.running = False

def run_consumer_group_demo(topic='churn', group_id='churn-processing-group', num_consumers=3):
    """Demonstrate consumer group with multiple consumers"""
    
    print(f"🎭 Starting Consumer Group Demo")
    print(f"📋 Topic: {topic}")
    print(f"👥 Group ID: {group_id}")
    print(f"🔢 Number of consumers: {num_consumers}")
    print("=" * 60)
    
    consumers = []
    threads = []
    
    try:
        # Start multiple consumers
        for i in range(num_consumers):
            consumer = GroupedConsumer(
                consumer_id=i+1,
                group_id=group_id,
                topics=[topic],
                process_time=0.1  # Simulate processing time
            )
            consumers.append(consumer)
            
            # Start consumer thread
            thread = consumer.start_consuming()
            threads.append(thread)
            
            time.sleep(1)  # Stagger consumer starts
        
        print(f"\n✅ All {num_consumers} consumers started successfully!")
        print("📊 Watching message distribution across consumers...")
        print("⏹️  Press Ctrl+C to stop all consumers\n")
        
        # Keep main thread alive
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Stopping all consumers...")
        
        # Stop all consumers
        for consumer in consumers:
            consumer.stop()
        
        # Wait for threads to finish
        for thread in threads:
            thread.join(timeout=5)
        
        print("✅ All consumers stopped")

if __name__ == "__main__":
    import sys
    
    topic = sys.argv[1] if len(sys.argv) > 1 else 'churn'
    num_consumers = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    
    run_consumer_group_demo(topic=topic, num_consumers=num_consumers)
```

## 🔧 Advanced Configuration and Monitoring

### Consumer Group Management

Let's create a utility to monitor consumer groups:

```python
# consumer_group_manager.py
from confluent_kafka.admin import AdminClient, NewTopic
from confluent_kafka import Consumer
import subprocess
import json

class ConsumerGroupManager:
    def __init__(self, bootstrap_servers):
        self.bootstrap_servers = bootstrap_servers
        self.admin_client = AdminClient({'bootstrap.servers': bootstrap_servers})
    
    def describe_consumer_group(self, group_id):
        """Describe consumer group using CLI (more detailed than Python API)"""
        cmd = [
            'kafka-consumer-groups',
            '--bootstrap-server', self.bootstrap_servers,
            '--group', group_id,
            '--describe'
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"📊 Consumer Group: {group_id}")
                print("=" * 80)
                print(result.stdout)
            else:
                print(f"❌ Error describing group: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Error running command: {e}")
    
    def list_consumer_groups(self):
        """List all consumer groups"""
        cmd = [
            'kafka-consumer-groups',
            '--bootstrap-server', self.bootstrap_servers,
            '--list'
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                groups = result.stdout.strip().split('\n')
                print("👥 Active Consumer Groups:")
                print("=" * 40)
                for group in groups:
                    if group.strip():
                        print(f"  • {group}")
                return groups
            else:
                print(f"❌ Error listing groups: {result.stderr}")
                return []
                
        except Exception as e:
            print(f"❌ Error running command: {e}")
            return []
    
    def reset_consumer_group_offset(self, group_id, topic, reset_to='earliest'):
        """Reset consumer group offsets"""
        cmd = [
            'kafka-consumer-groups',
            '--bootstrap-server', self.bootstrap_servers,
            '--group', group_id,
            '--reset-offsets',
            f'--to-{reset_to}',
            '--topic', topic,
            '--execute'
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Reset offsets for group '{group_id}' on topic '{topic}' to {reset_to}")
                print(result.stdout)
            else:
                print(f"❌ Error resetting offsets: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Error running command: {e}")

# Usage example
if __name__ == "__main__":
    manager = ConsumerGroupManager('localhost:19092,localhost:19093,localhost:19094')
    
    print("🔍 Listing consumer groups...")
    groups = manager.list_consumer_groups()
    
    if groups:
        print(f"\n📋 Describing first group: {groups[0]}")
        manager.describe_consumer_group(groups[0])
```

## 🧹 Complete Example: End-to-End Demo

Let's put it all together with a comprehensive example:

```shell
# Usage examples for the blog

# 1. Stream Turkish regions
python regions_producer.py

# 2. Consume regions with custom format
python regions_consumer.py

# 3. Download and stream CSV dataset
python csv_streamer.py --download-sample --input Churn_Modelling.csv --topic churn --key-column CustomerId --rate 5

# 4. Start consumer group demo (run in separate terminal)
python consumer_group_demo.py churn 3

# 5. Monitor consumer groups
python consumer_group_manager.py
```

## 📊 Performance Considerations

{{< alert icon="triangle-exclamation" cardColor="#ffd874" iconColor="#0f172a" textColor="#0f172a" >}}

**Production Performance Tips:**

- **Batch Size**: Increase `batch.size` for higher throughput (default: 16KB)
- **Linger Time**: Set `linger.ms` > 0 to batch more messages (5-100ms)
- **Compression**: Use `snappy` or `lz4` for good compression/speed balance
- **Acks**: Use `acks=all` for durability, `acks=1` for performance
- **Consumer Threads**: One consumer per partition for optimal parallelism
- **Async Processing**: Use callbacks for non-blocking operations

{{< /alert >}}

### Performance Configuration Example

```python
# high_performance_config.py

# High-throughput producer config
high_throughput_producer = {
    'bootstrap.servers': 'localhost:19092,localhost:19093,localhost:19094',
    'acks': '1',  # Wait for leader acknowledgment only
    'retries': 3,
    'batch.size': 65536,  # 64KB batches
    'linger.ms': 50,      # Wait up to 50ms to batch
    'compression.type': 'lz4',
    'buffer.memory': 67108864,  # 64MB buffer
    'max.in.flight.requests.per.connection': 5
}

# Low-latency producer config
low_latency_producer = {
    'bootstrap.servers': 'localhost:19092,localhost:19093,localhost:19094',
    'acks': '1',
    'retries': 0,         # No retries for lowest latency
    'batch.size': 1,      # Send immediately
    'linger.ms': 0,       # No batching
    'compression.type': 'none'
}

# Reliable consumer config
reliable_consumer = {
    'bootstrap.servers': 'localhost:19092,localhost:19093,localhost:19094',
    'group.id': 'reliable-consumer-group',
    'enable.auto.commit': False,  # Manual commit for reliability
    'auto.offset.reset': 'earliest',
    'max.poll.records': 100,      # Process in smaller batches
    'session.timeout.ms': 30000,
    'heartbeat.interval.ms': 10000
}
```

## 🎯 Summary

In this comprehensive guide, we've covered:

- ✅ **Python Environment Setup**: Virtual environments and confluent-kafka installation
- ✅ **Producer Patterns**: Basic, JSON, and CSV streaming producers
- ✅ **Consumer Patterns**: Simple and advanced consumers with error handling
- ✅ **Real-world Examples**: Turkish regions and customer churn datasets
- ✅ **Consumer Groups**: Multi-consumer coordination and load balancing
- ✅ **Data Generators**: CSV-to-Kafka streaming utilities
- ✅ **Monitoring Tools**: Consumer group management and offset tracking
- ✅ **Performance Tuning**: Configuration for different use cases

{{< alert icon="lightbulb" cardColor="#e0f7fa" iconColor="#0f172a" textColor="#0f172a" >}}

**Key Takeaways:**

1. **Use confluent-kafka** for production Python applications
2. **Implement proper error handling** in both producers and consumers
3. **Leverage consumer groups** for scalable data processing
4. **Monitor consumer lag** and group health regularly
5. **Choose configuration** based on your throughput/latency requirements
6. **Test with real datasets** to understand behavior patterns

{{< /alert >}}

## 📚 Related Articles

- [Deploy Multi-Node Kafka Cluster on Kubernetes](../20240602-kafka-deploy/)
- [Kafka Topics Management and Operations](../20240603-kafka-topics/)
- [Apache Spark and Kafka Integration](../20240609-spark-streaming/)

---

*All code examples in this article were tested with confluent-kafka 2.3.0 and Python 3.10 on our Kubernetes-deployed Kafka cluster.*

