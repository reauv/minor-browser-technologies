var path = require('path');
var express = require('express');
var session = require('express-session');

var server = express();

server.set('view engine', 'hbs');
server.use(session({secret: 'secret'}));
server.use(express.static(path.join(__dirname, 'public')));

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

server.get('/', function (request, response) {
    if(request.query.answer && !request.session.voted) {
        request.session.voted = true;
        votes.push({
            session: request.session.id,
            answer: request.query.answer,
        });
    }

    if(request.session.voted) {
        return response.render(
            'results',
            {
                votesByAnswers: getVotesByAnswers(),
                userVote: getUserVote(request.session.id)
            }
        )
    }

    return response.render('vote', { answers: answers });
});

/**
 * JSON API
 */
server.get('/api/vote/:id', function (request, response) {
    if(request.params.id && !request.session.voted) {
        request.session.voted = true;
        votes.push({
            session: request.session.id,
            answer: request.params.id,
        });

        response.end('Ok');
    }

    response.status(403);
    response.end('You are not allowed to cast a vote');
});

/**
 * HTML API
 */
server.get('/api/html/results', function (request, response) {
    return response.render(
        'results',
        {
            layout: false,
            votesByAnswers: getVotesByAnswers(),
            userVote: getUserVote(request.session.id)
        }
    )
});

console.log('Listening at localhost on port 8080');
server.listen('8080');
