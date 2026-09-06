FROM grafana/k6:latest

WORKDIR /k6

COPY src ./src

ENTRYPOINT ["k6"]
CMD ["run", "src/tests/smoke.test.js"]
