from h2x-dev-backend:latest

expose 80
env PORT 80

# DEVELOPMENT
run npm install -g nodemon ts-node
env MODE development
cmd [ "npm", "run", "dev-worker" ]
