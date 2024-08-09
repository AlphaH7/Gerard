# Gerard - A Retrieval Augmented Generation based Education tool to answer questions based on course related materials

A Retrieval Augmented Generator based Education tool, that has a role based login and has file upload support to a vector db. This application also has a support for chat that retrieves and uses data off the files uploaded. Backend support is via fast api (python) and has a frontend face of React JS (Next JS - typescript).

## Tech used - 

- Docker 
- Kubernetes (For streamlined deployments, load balancers and auto scaling)
- Fast API (Python)
- Milvus Vector DB (Document upload support)
- Attu Vector DB Client (Document upload support visualization)
- Minio (Document upload caching on server)
- Postgres SQL db (for user data collection support)
- React JS - Next JS (For chat support, teacher login and file upload UX support)
- Autoscalable Multi model Ollama Service

## Setup & Running the project

You need to have docker installed. 

```

git clone git@github.com:AlphaH7/Gerard.git

cd Gerard

docker-compose up --build

```
If all services run well and are up you must see the following on docker desktop - 




## Application Preview - 

<img width="1800" alt="image" src="https://github.com/user-attachments/assets/3ae25096-09b0-4de4-b04c-15f17a39c286">


## Analytics Preview - 

You can access analytics preview at /analytics route

<img width="1800" alt="image" src="https://github.com/user-attachments/assets/b19d8658-b080-4082-b806-b7229f1df424">

<img width="1800" alt="image" src="https://github.com/user-attachments/assets/4155c71a-8e1e-4b34-ae56-67ae33187a14">

<img width="1800" alt="image" src="https://github.com/user-attachments/assets/29bb3594-97a3-4fa5-aa7e-c3c20b50c15e">

<img width="1800" alt="image" src="https://github.com/user-attachments/assets/cff0578e-0719-4dd7-8761-9441a9bf1ee2">


## Courses Preview - 

You can access created courses, topics and uploded contents at /courses route

<img width="1800" alt="image" src="https://github.com/user-attachments/assets/72e05f58-0d32-4868-a3a8-8e66fa55ae44">


## API Doc - 

You can access the swagger API doc at /backend/apis/docs route

<img width="1800" alt="image" src="https://github.com/user-attachments/assets/a51b981e-9538-44af-852c-a7f7ba293889">


## File Heirarchy

```
Gerard/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── Dockerfile
│   ├── package.json
│   ├── pages/
│   │   ├── //all individual routes
│   ├── api/
│   │   └── api.js
│   └── context/
│       └── AuthContext.js
│
├── k8s/
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── postgres-deployment.yaml
│   ├── backend-autoscaler.yaml
│
└── docker-compose.yml
```

## License

This project is under MIT License. Please read the same carefully. Lets contribute and access Open source software responsibly. 
  
## Author

Made with ♥ - Alistier X.
