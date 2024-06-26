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

## Setup & Running the project

You need to have docker installed. 

```

git clone git@github.com:AlphaH7/Gerard.git

cd Gerard

docker-compose up --build

```
If all services run well and are up you must see the following on docker desktop - 

![image](https://github.com/AlphaH7/Gerard/assets/22297072/d5d49b78-73b2-4b47-894e-fba60ccac647)

## Application Preview - 

<img width="1800" alt="image" src="https://github.com/AlphaH7/Gerard/assets/22297072/b436a71d-2bbe-43fa-aa42-1ad8bc5c861a">



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
  
## Author

Made with ♥ - Alistier X.
