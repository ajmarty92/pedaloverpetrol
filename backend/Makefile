.PHONY: help install dev test migrate lint docker-up docker-down

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Install Python dependencies
	pip install -r requirements.txt

dev: ## Start dev server with auto-reload
	uvicorn main:app --reload --host 0.0.0.0 --port 8000

test: ## Run test suite
	python3 -m pytest tests/ -v

test-q: ## Run tests (quiet)
	python3 -m pytest tests/ -q

migrate: ## Run Alembic migrations to latest
	alembic upgrade head

migrate-new: ## Create a new migration (usage: make migrate-new MSG="add foo")
	alembic revision --autogenerate -m "$(MSG)"

lint: ## Run basic Python checks
	python3 -m py_compile main.py
	@echo "Compile check passed"

docker-up: ## Start backend + Postgres via Docker Compose
	docker compose up --build -d

docker-down: ## Stop Docker Compose services
	docker compose down
