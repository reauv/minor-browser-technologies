(function() {
    var resultsContainer = document.querySelector('#results');
    var formContainer = document.querySelector('#form');
    var content = document.querySelector('#content');
    var voteButton = document.querySelector('#vote');
    var WEBSOCKET_HOST = 'ws://localhost:8888';

    function updateResults(results) {
        resultsContainer.innerHTML = '';
        results.forEach(function(result) {
            var el = document.createElement('div');
            el.innerHTML = result.label + ' - ' + result.votes + ' votes'
            resultsContainer.appendChild(el);
        });
    };

    function hideForm() {
        formContainer.style.display = 'none';
    }

    function showResults() {
        resultsContainer.style.display = 'block';
    }

    ajax = {
        fetchResults: function() {
            var request = new XMLHttpRequest();
            request.open('GET', '/api/results', true);
            request.send();

            request.onload = function() {
                if (request.status >= 200 && request.status < 400) {
                    var data = JSON.parse(request.responseText);
                    hideForm();
                    showResults();
                    updateResults(data);
                }
            }
        },

        onVoteButtonClick: function() {
            var answer = document.querySelector('input[name="answer"]:checked');
            var value = answer.value;

            var request = new XMLHttpRequest();
            request.open('GET', '/api/vote/' + value, true);
            request.send();

            request.onload = function () {
                if (request.status >= 200 && request.status < 400) {
                    this.fetchResults();
                    setInterval(this.fetchResults, 6000);
                }
            }.bind(this);

            event.preventDefault();
        },

        init: function() {
            console.log('Using AJAX');

            if(voteButton) {
                voteButton.addEventListener('click', this.onVoteButtonClick.bind(this));
            }
        }
    },

    websockets = {
        connection: null,

        setupConnection: function() {
            var id = Cookies.get('client_id');
            this.connection = new WebSocket(WEBSOCKET_HOST + '?id=' + id, 'echo-protocol');

            this.connection.onclose = function (error) {
                this.destroy();
                ajax.init();
            }.bind(this);

            this.connection.onmessage = function(message) {
                var data = JSON.parse(message.data);
                console.log('Message received:');
                console.log(data);

                if (data.type === 'CONNECTED') {
                    this.onConnected(data);
                }

                if (data.type === 'VOTE_PROCESSED') {
                    this.onVoteProcessed();
                }

                if (data.type === 'NEW_VOTE') {
                    this.onNewVote(data);
                }
            }.bind(this);
        },

        onVoteButtonClick: function() {
            if (this.connection.readyState !== this.connection.OPEN) {
                return ajax.onVoteButtonClick();
            }

            var answer = document.querySelector('input[name="answer"]:checked');
            var value = answer.value;

            this.connection.send(JSON.stringify({ type: 'vote', value: value }));
            event.preventDefault();
        },

        onConnected: function(data) {
            Cookies.set('client_id', data.payload.id);
        },

        onVoteProcessed: function() {
            hideForm();
            showResults();
        },

        onNewVote: function(data) {
            updateResults(data.payload.votesByAnswers);
        },

        init: function() {
            console.log('Using websockets');
            this.setupConnection();

            if(voteButton) {
                voteButton.addEventListener('click', this.onVoteButtonClick.bind(this));
            }
        },

        destroy: function() {
            if(voteButton) {
                voteButton.removeEventListener('click', this.onVoteButtonClick);
            }
        }
    }

    if('WebSocket' in window) {
        document.querySelector('html').classList.add('js');
        websockets.init();
    } else {
        document.querySelector('html').classList.add('js');
        ajax.init();
    }
}());
