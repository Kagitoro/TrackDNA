@echo off
setlocal
cd /d "%~dp0"
echo Starting TrackDNA with Docker Compose...
docker compose up
