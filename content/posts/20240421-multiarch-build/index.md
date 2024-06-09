---
title: "Build Docker Images with Multiarch Support"
summary: "This article is showing how to build any docker image for any architecture type, so that you can build your own architecture specific images and be able to run them on your docker engine."
description: "This article is showing how to build any docker image for any architecture type, so that you can build your own architecture specific images and be able to run them on your docker engine."
categories: ["Docker", "Colima", "Microservices"]
tags: ["tutorial", "docker", "colima", "microservices", "multiarchitecture", "containers"]
date: 2024-04-21
draft: false
showauthor: false
authors:
  - nacisimsek
---
# Build Docker Images with Multiarch Support

When working with the container images, you may come across an issue related to the mismatch of the platforms of the docker engine and the container image itself.

```
The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8) and no specific platform was requested
```

I am running [Colima](https://github.com/abiosoft/colima) as a docker engine on my **Apple Mac** with **silicon** processor which is an **ARM64** based architecture (platform). When the image of the container I try to deploy on my Colima is built for an architecture other than ARM64 (ex: AMD64), it gives an incompatible platform error.

One way of recover from that error is to start Colima on Mac silicon with QEMU rosetta emulation of x86_64 arch type:

```
colima start --cpu 4 --memory 8 --arch x86_64
```

This way, we could be able to deploy AMD64 based docker images on our docker environments, however, since it is virtualizing the underlying processing architecture, there is a significant performance decrease occurs.

Therefore, the best way is to re-build those images to make them multiarchitecture compatible, and run them on the Colima docker engine without virtualization.

To do this, follow the below steps:

1. Install Colima using homebrew if you have not already:

   ```shell
   brew install colima
   ```
2. Start colima which is compatible with the underlying silicon architecture. If you do not specify the architecture, Colima will use the underlying architecture of the machine anyway:

   ```shell
   colima start --cpu 4 --memory 8 --arch aarch64
   ```
   You can verify the colima is running by the command `colima status`.
3. Install Docker Buildx

   a. Download buildx to your local, below is the latest version as of now:

   https://github.com/docker/buildx/releases/download/v0.13.1/buildx-v0.13.1.darwin-amd64

   b. Create plug-ins folder if you do not have any:

   ```shell
   mkdir -p ~/.docker/cli-plugins
   ```
   c. Move the downloaded Buildx binary to the `~/.docker/cli-plugins` directory and rename it to `docker-buildx` via below command.

   ```shell
   mv buildx-v0.13.1.darwin-amd64 ~/.docker/cli-plugins/docker-buildx
   ```
   d. Make it executable:

   ```shell
   chmod +x ~/.docker/cli-plugins/docker-buildx
   ```
   e. Finally, verify the installation:

   ```bash
   docker buildx version
   ```
   This should show the following output:

   > github.com/docker/buildx v0.13.1 788433953af10f2a698f5c07611dddce2e08c7a0
   >
4. Create a new Buildx builder instance with the name "multiplatform-builder": `docker buildx create --name multiplatform-builder`
5. Use the new builder instance by running: `docker buildx use multiplatform-builder`
6. Verify that the builder instance is configured for multi-platform builds: `docker buildx inspect --bootstrap`

   ```
   Name:          multiplatform-builder
   Driver:        docker-container
   Last Activity: 2024-04-14 12:03:28 +0000 UTC

   Nodes:
   Name:                  multiplatform-builder0
   Endpoint:              colima
   Status:                running
   BuildKit daemon flags: --allow-insecure-entitlement=network.host
   BuildKit version:      v0.13.1
   Platforms:             linux/arm64, linux/amd64, linux/amd64/v2
   ```
7. Now, let's build a simple example Docker image for multiple platforms (e.g., linux/amd64 and linux/arm64):

   > 📝 **Note:**
   > Replace the following "**your-username**" part with your Docker Hub username. The --push flag is used to push the image to Docker Hub once the build is complete.
   > Also modify the **image-name** and **tag** as you wish. The image to be built need to be represented with a dockerfile in the same directory where below command is executed.
   > It is also a **must** to push the multi architecture images to a registry since the local repository does not support to store multi-architecture images
   >

   ```bash
   docker buildx build --platform linux/amd64,linux/arm64 -t <your-username>/<image-name>:<tag> . --push
   ```
8. Finally, after the build completes, you can verify the multi-platform image on Docker Hub by visiting your image repository: [https://hub.docker.com/r/your-username/multiplatform-image/tags](https://hub.docker.com/r/your-username/multiplatform-image/tags)

   You should see the given tag with both "linux/amd64" and "linux/arm64" platforms listed.
