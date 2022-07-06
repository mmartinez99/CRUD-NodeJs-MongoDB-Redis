# CRUD-NodeJs-MongoDB-Redis

CRUD RESTFUL API using Node JS, Express JS, and Redis.


L’application permet d'afficher, modifier, supprimer des bibliothèques.

![Redis-MONGO](https://user-images.githubusercontent.com/57175461/177285489-d41166d9-4671-48a0-855c-7043cdabd77a.png)


A chaque requête, nous vérifions d'abord si les données sont mises en cache dans Redis. Si c'est le cas, nous renvoyons les données. Si ce n'est pas le cas nous récupérerons alors les données de MongoDB et les mettrons également en cache dans Redis.


![image](https://user-images.githubusercontent.com/57175461/176961920-e17fc6f7-2526-42ff-8b70-9297140c6ac1.png)
 
![image](https://user-images.githubusercontent.com/57175461/177348755-a0d6cd9a-61ae-4e5b-a98a-b4ccfb755dc3.png)
