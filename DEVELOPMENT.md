# Development Environment Setup

This document describes how to set up the development environment for the MYS project.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+
- npm

## Development Environment

The project includes a Docker Compose configuration for running Elasticsearch and Kibana for development and testing.

### Starting the Development Environment

```bash
# Start Elasticsearch and Kibana
docker-compose up -d

# Check that services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### Accessing Services

- **Elasticsearch**: http://localhost:9200
- **Kibana**: http://localhost:5601

### Data and Configuration

- Elasticsearch data: `./dev-data/elasticsearch/`
- Kibana data: `./dev-data/kibana/`
- Elasticsearch config: `./dev-config/elasticsearch/`
- Kibana config: `./dev-config/kibana/`

### Running Data Collection

```bash
# Install dependencies
npm install

# Compile TypeScript
npx tsc

# Run data collection with limits
MAX_RUNTIME=300 MAX_ITERATIONS=100 LOG_LEVEL=info node dist/index.js [checkpoint]
```

### Environment Variables

- `MAX_RUNTIME`: Maximum runtime in seconds (default: 3600)
- `MAX_ITERATIONS`: Maximum number of iterations (default: 10000)
- `LOG_LEVEL`: Logging level (default: info)

### Stopping the Development Environment

```bash
# Stop services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

## GitHub Actions

The project includes a GitHub Action workflow for manual data collection runs. The workflow can be triggered manually from the Actions tab with configurable parameters:

- Starting checkpoint
- Maximum runtime
- Maximum iterations

Upon completion, if new data is collected, the action will create a Pull Request with the new data for review and merging.