from h2x-dev-backend:latest

expose 8013
env PORT 8013

# DEVELOPMENT
run npm install -g nodemon ts-node
env MODE development
cmd npm install && npm run dev-worker
