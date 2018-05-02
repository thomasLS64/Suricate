# Suricate
## Installation
```
cd Suricate
docker build -t suricate .
```

## Starting
```
docker run -d -p '8080:80' --restart 'always' suricate
```