NodeJS cluster
=========

Clustering with proxy so you can set multiple domain names on port 80

Domains can be realtime added, removed or just show all domains by command line


Requirements
----
  - Commander
  - Http proxy
  
  ```sh
sudo npm install
```

How to start
----
This experiments can be start with the cluster.js
```sh
sudo nodejs cluster.js
```
  How to start this chat as an service:
----

  
 ```sh
 sudo forever start -l forever.log -o out.log -e err.log -a cluster.js
  ```
  
Problems and fixes
----

When you got problems with ubuntu server because it can't find the node command execute the following line:

```sh
sudo update-alternatives --install /usr/sbin/node node /usr/bin/nodejs 99
```
