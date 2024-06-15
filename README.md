# Gerard - A Retrieval Augmented Generation based Education tool to answer questions based on course related materials

This application is enclosed by Kubernetes & Docker. Currently has 2 containers - Frontend & Backend (will scale as required)

## Tech used - 

- Docker 
- Kubernetes (For streamlined deployments, load balancers and auto scaling)
- Fast API (Python)
- Vector DB (Document upload support)
- Postgres SQL db (for user data collection support)
- React JS - Next JS (For chat support, teacher login and file upload UX support)

## File Heirarchy

```
fastapi-nextjs-app/
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