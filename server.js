var fs = require('fs');
var path = require('path');
var http = require('http');
var env = require('./env');
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var WebSocketServer = require('websocket').server;

var app = express();
var server = http.createServer(app);

app.set('view engine', 'hbs');

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var answers = [
    { id: '1', label: 'Krijn' },
    { id: '2', label: 'Koop' },
    { id: '3', label: 'Vasilis' },
    { id: '4', label: 'Joost' },
    { id: '5', label: 'Donny' },
    { id: '6', label: 'Laurens' },
    { id: '7', label: 'Michele' },
];

var votes = [
    { answer: '1' },
    { answer: '3' },
    { answer: '6' },
    { answer: '6' },
];

function getVotesByAnswers() {
    return answers.map(function(answer) {
        answer.votes = votes.filter(function(vote) {
            return vote.answer === answer.id;
        }).length;

        return answer;
    });
}

function getUserVote(sessionId) {
    var vote = votes.find(function(vote) {
        return vote.session === sessionId;
    });

    return answers.find(function(answer) {
        return answer.id === vote.answer;
    });
}

function generateClientKey() {
    return Math.random().toString(36).substring(7);
}

function findClientByConnection(connection) {
    return clients.find(function(client) {
        return client.connection === connection;
    });
}

function findClientById(id) {
    if(!id || id.length < 1) {
        return null;
    }

    return clients.find(function(client) {
        return client.id === id;
    });
}

function getClient(id) {
    var client = findClientById(id);

    if(client) {
        return client;
    } else {
        client = { id: generateClientKey(), connection: null, voted: false }
        clients.push(client);
        return client;
    }
}

/**
 * HTTP server
 */
app.get('/', function (request, response) {
    var client = getClient(request.cookies.client_id);

    response.cookie('client_id', client.id, { expires: new Date(Date.now() + 900000) });

    if(request.query.answer && !client.voted) {
        client.voted = true;
        votes.push({
            answer: request.query.answer,
        });
    }

    if(client.voted) {
        return response.render(
            'results',
            {
                votesByAnswers: getVotesByAnswers(),
            }
        )
    }

    return response.render('vote', { answers: answers });
});

/**
 * JSON API
 */
app.get('/api/vote/:id', function (request, response) {
    var client = getClient(request.cookies.client_id);

    if(request.params.id && !client.voted) {
        client.voted = true;
        votes.push({
            answer: request.params.id,
        });

        response.end('Ok');
    }

    response.status(403);
    response.end('You are not allowed to cast a vote');
});

app.get('/api/results', function (request, response) {
    return response.json(getVotesByAnswers());
});

/**
 * HTML API
 */
app.get('/api/html/results', function (request, response) {
    return response.render(
        'results',
        {
            layout: false,
            votesByAnswers: getVotesByAnswers(),
            userVote: getUserVote(request.session.id)
        }
    )
});

server.listen(env.PORT, function() {
    console.log((new Date()) + ' HTTP Server is listening on port ' + env.PORT);
});

/**
 * Websockets
 */
var clients = [];

var wsHttpServer = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

wsServer = new WebSocketServer({
    httpServer: wsHttpServer,
    autoAcceptConnections: false,
 });

function originIsAllowed(origin) {
    return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
        request.reject();
        return console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    }

    var id = request.resourceURL.query.id;

    var connection = request.accept('echo-protocol', request.origin);
    var client = getClient(id);
    client.connection = connection;

    wsOutput.connected({ id: client.id }, connection);

    connection.on('message', function(message) {
        console.log('Message received from ' + client.id);
        var payload = JSON.parse(message.utf8Data);

        if (payload.type === 'vote') {
            wsInput.onVote(payload, connection);
        }
    });

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

wsInput = {
    onVote: function(payload, connection) {
        votes.push({
            answer: payload.value,
        });

        var client = findClientByConnection(connection);
        client.voted = true;

        wsOutput.voteProcessed(payload, connection);
        wsOutput.newVote(payload, connection);
    }
}

wsOutput = {
    connected: function(payload, connection) {
        var message = {
            type: 'CONNECTED',
            payload: payload,
        }

        connection.send(JSON.stringify(message));
    },

    voteProcessed: function(payload, connection) {
        var message = {
            type: 'VOTE_PROCESSED',
        }

        connection.send(JSON.stringify(message));
    },

    newVote: function(payload, connection) {
        var message = {
            type: 'NEW_VOTE',
            payload: {
                votesByAnswers: getVotesByAnswers(),
            },
        }

        clients.forEach(function(client) {
            if (client.voted && client.connection) {
                client.connection.send(JSON.stringify(message));
            }
        });
    }
}

wsHttpServer.listen(env.WEBSOCKET_PORT, function() {
    console.log((new Date()) + ' Websocket Server is listening on port ' + env.WEBSOCKET_PORT);
});
