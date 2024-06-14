# Gerard - A Retrieval Augmented Generation based Education tool to answer questions based on course related materials

This application is enclosed by Docker. Currently has 2 containers - Frontend & Backend (will scale as required)

## Tech used - 

- Docker 
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
│   └── (Next.js files will go here later)
│
└── docker-compose.yml
```
  
## Author

Made with ♥ - Alistier X.