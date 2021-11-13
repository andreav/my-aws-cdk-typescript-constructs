# Stack FargatePublicStack

Cannot reach the server on port 80 until I put `assignPublicIp: true` on service  
Now the task is in the public subnet

# Stack FargatePrivateStack

Why I cannot reach the private service by using the private IP and Cloudshell? 
Because CloudShell still not have access to private network.

To test it is working:

1. deploy FagatePrivateStack
1. deploy Ec2Stack with SSH keyPair
1. connect to EC2
1. curl <Task_pivate_ip>

You will see the response from the server


# TODOs

- [ ] Add Volume on EFS
- [ ] Add CloudMap example
* Deploy mysql image  
* Deploy phpmyadmin image ([here](https://hub.docker.com/_/phpmyadmin))
- [ ] Add ECR example
* Create a repository
* Build an image
* Push an image
