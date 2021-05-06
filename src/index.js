const express = require("express");
const { v4: uuidV4 } = require("uuid");

const app = express();

app.use(express.json());

const costumers = [];

function verifyIfCpfAccountExists(request, response, next) {
  const { cpf } = request.headers;

  const costumer = costumers.find((costumer) => costumer.cpf === cpf);

  if (!costumer) {
    return response.status(404).json({ error: "Costumer not found!" });
  }

  request.costumer = costumer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.post("/accounts", (request, response) => {
  const { cpf, name } = request.body;

  const costumerAlreadyExists = costumers.some(
    (costumer) => costumer.cpf === cpf
  );

  if (costumerAlreadyExists) {
    return response.status(400).json({ error: "Costumer already exists!" });
  }

  costumers.push({
    cpf,
    name,
    id: uuidV4(),
    statements: [],
  });

  return response.status(201).send();
});

app.get("/statements", verifyIfCpfAccountExists, (request, response) => {
  const { costumer } = request;

  return response.json(costumer.statements);
});

app.post("/deposit", verifyIfCpfAccountExists, (request, response) => {
  const { costumer } = request;
  const { description, amount } = request.body;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  costumer.statements.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfCpfAccountExists, (request, response) => {
  const { costumer } = request;
  const { amount } = request.body;

  const balance = getBalance(costumer.statements);

  if (balance < amount) {
    return response.status(400).json({ error: "Insufficient funds!" });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  costumer.statements.push(statementOperation);

  return response.status(201).send();
});

app.get("/statement/date", verifyIfCpfAccountExists, (request, response) => {
  const { costumer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");
  const statementsOnThisDate = costumer.statements.filter((costumer) => {
    return statement.created_at.toDateString() === dateFormat.toDateString();
  });

  return response.json(statementsOnThisDate);
});

app.put("/accounts", verifyIfCpfAccountExists, (request, response) => {
  const { costumer } = request;
  const { name } = request.body;

  costumer.name = name;

  return response.status(204).send();
});

app.delete("/accounts", verifyIfCpfAccountExists, (request, response) => {
  const { costumer } = request;

  costumers.splice(costumer, 1);

  return response.status(204).send();
});

app.get("/balance", verifyIfCpfAccountExists, (request, response) => {
  const { costumer } = request;
  const balance = getBalance(costumer.statements);

  return response.json(balance);
});

app.get("/accounts", (request, response) => {
  return response.json(costumers);
});

app.listen(3333, () => {
  console.log("Server is running!");
});
