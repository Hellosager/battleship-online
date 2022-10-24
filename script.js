const fieldCount = 10;
const up = "up", down = "down", right = "right", left = "left";

const water = "water",
    ship = "ship",
    shipHit = "shipHit",
    shot = "shot";

var ship1 = {
    length: 2,
    direction: right,
    color: "cornsilk",
    fields: []
}
var ship2 = {
    length: 3,
    direction: right,
    color: "green",
    fields: []
}
var ship3 = {
    length: 3,
    direction: right,
    color: "black",
    fields: []
}
var ship4 = {
    length: 4,
    direction: right,
    color: "violet",
    fields: []
}
var ship5 = {
    length: 5,
    direction: right,
    color: "yellow",
    fields: []
}

var ships = [ship1, ship2, ship3, ship4, ship5];
var selectedShip;


var idInput = document.getElementById("friendId");
var friendId;
var friendConnection;

var ourField;
var enemyField;
var canvasContextOurField;
var canvasContextEnemyField;

var fieldSize;
var gameField = [];
var enemyGameField = [];

var gameIsRunning = false;
var yourTurn = false;

window.onload = init;

function init() {
    ourField = document.getElementById("ourField");
    enemyField = document.getElementById("enemyField");
    canvasContextOurField = ourField.getContext("2d");
    canvasContextEnemyField = enemyField.getContext("2d");

    // hier ergänzen wir eine Variable an dem Context, damit wir die beiden später unterscheiden können
    canvasContextOurField.enemyCanvas = false;
    canvasContextEnemyField.enemyCanvas = true;

    document.addEventListener("keypress", rotateSelectedShip);

    fieldSize = ourField.width / fieldCount; // 400 / 10

    ourField.addEventListener('mousemove', drawPreviewShipAndGrid);
    ourField.addEventListener('mouseup', placeShip);
    ourField.addEventListener('mouseleave', () => drawFullFieldAndGrid(gameField, canvasContextOurField));

    enemyField.addEventListener('mousemove', drawPreviewCross);
    enemyField.addEventListener('mouseup', shoot);
    enemyField.addEventListener('mouseleave', () => drawFullFieldAndGrid(enemyGameField, canvasContextEnemyField));

    gameField = initGameField();
    enemyGameField = initGameField();

    drawGrid(canvasContextOurField);
    drawGrid(canvasContextEnemyField);
}

function setupGame() {
    ship1.fields = [];
    ship2.fields = [];
    ship3.fields = [];
    ship4.fields = [];
    ship5.fields = [];

    gameField = initGameField();
    enemyGameField = initGameField();

    drawFullFieldAndGrid(gameField, canvasContextOurField);
    drawFullFieldAndGrid(enemyGameField, canvasContextEnemyField);

    enemyField.classList.add("disabled");
}

function drawFullField(field, canvasContext) {
    canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);

    if (!canvasContext.enemyCanvas) {
        drawShips();
    }

    for (var x = 0; x < fieldCount; x++) {
        for (var y = 0; y < fieldCount; y++) {
            drawSquare(x, y, field, canvasContext);
        }
    }
}

function drawFullFieldAndGrid(field, canvasContext) {
    drawFullField(field, canvasContext);
    drawGrid(canvasContext);
}

function drawSquare(x, y, field, canvasContext) {
    if (field[x][y] === water) {
        // hier müssen wir nix machen, weil unser Background schon blau ist
    } else if (field[x][y] === ship) {
        // wird bereits durch drawShips() behandelt
    } else if (field[x][y] === shipHit) {
        if (canvasContext.enemyCanvas === true) {
            canvasContext.fillStyle = "red";
            canvasContext.fillRect(x * fieldSize, y * fieldSize, fieldSize, fieldSize);
        } else {
            // Schiff sollte schon gezeichnet sein, wir setzen nur das Kreuz drauf
            drawCross(x, y, canvasContext);
        }
    } else if (field[x][y] === shot) {
        drawCross(x, y, canvasContext);
    }
}

function drawPreviewCross() {
    if (gameIsRunning && yourTurn) {
        drawFullFieldAndGrid(enemyGameField, canvasContextEnemyField);

        var fieldX = Math.floor(event.offsetX / fieldSize);
        var fieldY = Math.floor(event.offsetY / fieldSize);

        drawCross(fieldX, fieldY, canvasContextEnemyField);
    }
}

function drawCross(x, y, canvasContext) {
    canvasContext.strokeStyle = "red";
    canvasContext.beginPath();
    canvasContext.moveTo(x * fieldSize, y * fieldSize);
    canvasContext.lineTo((x * fieldSize) + fieldSize, (y * fieldSize) + fieldSize);
    canvasContext.moveTo((x * fieldSize) + fieldSize, y * fieldSize);
    canvasContext.lineTo(x * fieldSize, (y * fieldSize) + fieldSize);
    canvasContext.stroke();
}

function placeShip(event) {
    if (selectedShip && !gameIsRunning) {
        var fieldX = Math.floor(event.offsetX / fieldSize);
        var fieldY = Math.floor(event.offsetY / fieldSize);

        selectedShip.fields = [];
        if (selectedShip.direction === up) {
            for (var y = fieldY; y < fieldY + selectedShip.length; y++) {
                if(!checkCoordOnField(fieldX, y) || anyShipGotHit(fieldX, y)) {
                    selectedShip.fields = [];
                    return;
                }

                selectedShip.fields.push({ x: fieldX, y });
                gameField[fieldX][y] = ship;
            }
        } else if (selectedShip.direction === down) {
            for (var y = fieldY; y > fieldY - selectedShip.length; y--) {
                if(!checkCoordOnField(fieldX, y) || anyShipGotHit(fieldX, y)) {
                    selectedShip.fields = [];
                    return;
                }

                selectedShip.fields.push({ x: fieldX, y });
                gameField[fieldX][y] = ship;
            }
        } else if (selectedShip.direction === right) {
            for (var x = fieldX; x > fieldX - selectedShip.length; x--) {
                if(!checkCoordOnField(x, fieldY) || anyShipGotHit(x, fieldY)) {
                    selectedShip.fields = [];
                    return;
                }

                selectedShip.fields.push({ x, y: fieldY });
                gameField[x][fieldY] = ship;
            }
        } else if (selectedShip.direction === left) {
            for (var x = fieldX; x < fieldX + selectedShip.length; x++) {
                if(!checkCoordOnField(x, fieldY) || anyShipGotHit(x, fieldY)) {
                    selectedShip.fields = [];
                    return;
                }

                selectedShip.fields.push({ x, y: fieldY });
                gameField[x][fieldY] = ship;
            }
        }

        canvasContextOurField.clearRect(0, 0, ourField.width, ourField.height);
        drawShips();
        drawGrid(canvasContextOurField);
    }
}

function checkCoordOnField(x, y) {
    return x >= 0 && x < fieldCount && y >= 0 && y < fieldCount;
}

function drawShips() {
    drawShip(ship1);
    drawShip(ship2);
    drawShip(ship3);
    drawShip(ship4);
    drawShip(ship5);
}

function drawShip(ship) {
    if (ship.fields) {
        canvasContextOurField.fillStyle = ship.color;
        for (var fieldNumber = 0; fieldNumber < ship.fields.length; fieldNumber++) {
            canvasContextOurField.fillRect(ship.fields[fieldNumber].x * fieldSize, ship.fields[fieldNumber].y * fieldSize, fieldSize, fieldSize);
        }
    }
}

function drawPreviewShip(event) {
    drawFullField(gameField, canvasContextOurField);

    var fieldX = Math.floor(event.offsetX / fieldSize);
    var fieldY = Math.floor(event.offsetY / fieldSize);

    var startX = fieldX * fieldSize;
    var startY = fieldY * fieldSize;

    if (selectedShip) {
        canvasContextOurField.fillStyle = selectedShip.color;
        if (selectedShip.direction === up) {
            for (var y = fieldY; y < fieldY + selectedShip.length; y++) {
                canvasContextOurField.fillRect(startX, y * fieldSize, fieldSize, fieldSize);
            }
        } else if (selectedShip.direction === down) {
            for (var y = fieldY; y > fieldY - selectedShip.length; y--) {
                canvasContextOurField.fillRect(startX, y * fieldSize, fieldSize, fieldSize);
            }
        } else if (selectedShip.direction === right) {
            for (var x = fieldX; x > fieldX - selectedShip.length; x--) {
                canvasContextOurField.fillRect(x * fieldSize, startY, fieldSize, fieldSize);
            }
        } else if (selectedShip.direction === left) {
            for (var x = fieldX; x < fieldX + selectedShip.length; x++) {
                canvasContextOurField.fillRect(x * fieldSize, startY, fieldSize, fieldSize);
            }
        }
    }

}

function drawPreviewShipAndGrid(event) {
    if (!gameIsRunning) {
        drawPreviewShip(event);
        drawGrid(canvasContextOurField);
    }
}

function drawGrid(canvasContext) {

    canvasContext.strokeStyle = "black";

    for (var i = 1; i < fieldCount; i++) {
        canvasContext.beginPath();
        canvasContext.moveTo(0, i * fieldSize);
        canvasContext.lineTo(ourField.height, i * fieldSize);
        canvasContext.moveTo(i * fieldSize, 0);
        canvasContext.lineTo(i * fieldSize, ourField.width);
        canvasContext.stroke();
    }
}

function initGameField() {
    var newGameField = [];
    for (var x = 0; x < fieldCount; x++) {
        newGameField.push(new Array());
        for (var y = 0; y < fieldCount; y++) {
            newGameField[x][y] = water;
        }
    }
    return newGameField;
}

var ourPC = new Peer();
ourPC.on('open', function (id) {
    document.getElementById("myId").innerText = id;
});

ourPC.on('connection', function (conn) {
    if (!friendConnection) {
        friendConnection = conn;
        friendConnection.on('data', receiveData);
        friendId = friendConnection.peer;
        yourTurn = false;
        console.log("Connected to " + friendId);
    }
});

function connectToFriend(e) {
    if (e.code === "Enter") {
        friendId = idInput.value.trim();
        friendConnection = ourPC.connect(friendId);
        yourTurn = true;
        friendConnection.on('data', receiveData);
        console.log("Connected to " + friendId);
    }
}

function receiveData(data) {
    console.log(data);
    if (data.type === "startGame" && !gameIsRunning) {
        if(allShipsPlaced()) {
            gameIsRunning = true;
            updateEnemyFieldStatus();
            drawFullFieldAndGrid(gameField, canvasContextOurField);    
        }

        friendConnection.send({
            type: "startGameConfirmation",
            start: allShipsPlaced()
        });
        
    } else if (data.type === "shoot") {
        createShootResponse(data.x, data.y);
    } else if (data.type === "shootResponse") {
        enemyGameField[data.x][data.y] = data.fieldType;

        if (data.fieldType === shipHit) {
            canvasContextEnemyField.fillStyle = "red";
            canvasContextEnemyField.fillRect(data.x * fieldSize, data.y * fieldSize, fieldSize, fieldSize);
            if(data.won === true) {
                gameIsRunning = false;
                yourTurn = !yourTurn;
                alert("Du hast gewonnen!");
                setupGame();
            }
        } else if (data.fieldType === shot) {
            yourTurn = !yourTurn;
            updateEnemyFieldStatus();
            friendConnection.send({
                type: "switchTurn"
            });
        }
    } else if (data.type === "switchTurn") {
        yourTurn = !yourTurn;
        updateEnemyFieldStatus();
    } else if(data.type === "startGameConfirmation") {
        if(data.start) {
            gameIsRunning = true;
            drawFullFieldAndGrid(gameField, canvasContextOurField);
            updateEnemyFieldStatus();
        } else {
            alert("Gegner hat noch nicht alle Schiffe platziert!");
        }
    }
}

function allShipsPlaced() {
    return ship1.fields.length > 0 &&
            ship2.fields.length > 0 &&
            ship3.fields.length > 0 &&
            ship4.fields.length > 0 &&
            ship5.fields.length > 0;
}

function updateEnemyFieldStatus() {
    if (yourTurn) {
        enemyField.classList.remove("disabled");
    } else {
        enemyField.classList.add("disabled");
    }
}

function createShootResponse(x, y) {
    if (anyShipGotHit(x, y)) {
        gameField[x][y] = shipHit;
    } else if (gameField[x][y] === water) {
        gameField[x][y] = shot;
    }

    drawFullFieldAndGrid(gameField, canvasContextOurField);
    var loseGame = allShipsDown();
    if(loseGame) {
        gameIsRunning = false;
        yourTurn = !yourTurn;
    }


    friendConnection.send({
        type: "shootResponse",
        x: x,
        y: y,
        fieldType: gameField[x][y],
        won: loseGame
    });

    if(loseGame) {
        alert("Du hast verloren!");
        setupGame();
    }
}

function allShipsDown() {
    return shipDown(ship1) && shipDown(ship2) && shipDown(ship3) && shipDown(ship4) && shipDown(ship5);
}

function shipDown(ship) {
    for(var field = 0; field < ship.fields.length; field++) {
        var x = ship.fields[field].x;
        var y = ship.fields[field].y;
        if(gameField[x][y] !== shipHit) {
            return false;
        }
    }

    return true;
}

function shoot(event) {
    if (gameIsRunning && yourTurn) {
        var fieldX = Math.floor(event.offsetX / fieldSize);
        var fieldY = Math.floor(event.offsetY / fieldSize);

        if(enemyGameField[fieldX][fieldY] !== shot && enemyGameField[fieldX][fieldY] !== shipHit) {
            friendConnection.send({
                type: "shoot",
                x: fieldX,
                y: fieldY
            });
        }
    }
}

function anyShipGotHit(x, y) {
    return shipGotHit(ship1, x, y) || shipGotHit(ship2, x, y) || shipGotHit(ship3, x, y) || shipGotHit(ship4, x, y) || shipGotHit(ship5, x, y);
}

function shipGotHit(ship, x, y) {
    for (var field = 0; field < ship.fields.length; field++) {
        if (ship.fields[field].x === x && ship.fields[field].y === y) {
            return true;
        }
    }
}

function startGame() {
    if (!gameIsRunning && friendConnection) {
        if(!allShipsPlaced()) {
            alert("Platziere zuerst alle Schiffe!");
        } else {
            friendConnection.send({
                type: "startGame"
            });
        }
    }
}

function selectShip(e) {
    var shipNumber = e.srcElement.value;
    selectedShip = ships[shipNumber];
}

function rotateSelectedShip(event) {
    if (event.code === "Space" && selectedShip) {

        if (selectedShip.direction === up) {
            selectedShip.direction = left;
        } else if (selectedShip.direction === left) {
            selectedShip.direction = down;
        } else if (selectedShip.direction === down) {
            selectedShip.direction = right;
        } else if (selectedShip.direction === right) {
            selectedShip.direction = up;
        }

        // Änderungen sehen wir erst, wenn wir die Maus bewegen, weil hier leider zu aufwändig

    }
}
