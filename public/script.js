(function() {


    var resultsContainer = document.querySelector('#results');
    var formContainer = document.querySelector('#form');
    var content = document.querySelector('#content');
    var voteButton = document.querySelector('#vote');
    var WEBSOCKET_HOST = window.WEBSOCKET_URL;

    function hasRequirements() {
        return (
            !!document.querySelector &&
            !!Function.prototype.bind
        );
    }

    function isIE() {
        var nav = navigator.userAgent.toLowerCase();

        return (nav.indexOf('msie') != -1)
            ? parseInt(nav.split('msie')[1])
            : false;
    }

    function patchConsole() {
        if (!window.console) window.console = {};
        if (!window.console.log) window.console.log = function () { };
    }

    function updateResults(results) {
        results.forEach(function(result) {
            var el = document.querySelector('[data-result-id="' + result.id + '"]');
            var barEl = el.querySelector('.js-bar-fill');
            var voteCountEl = el.querySelector('.js-vote-count');
            var votePercentageEl = el.querySelector('.js-vote-percentage');
            voteCountEl.innerHTML = result.votes;
            votePercentageEl.innerHTML = result.percentage;
            barEl.style.width = result.percentage + '%';
        });
    };


    function hideForm() {
        formContainer.style.display = 'none';
    }

    function showResults() {
        resultsContainer.style.display = 'block';
        resultsContainer.removeAttribute('hidden');
    }

    function addClass(el, className) {
        if (el.classList) {
          el.classList.add(className);
        } else {
          el.className += ' ' + className;
        }
    }

    ajax = {
        fetchResults: function() {
            var request = new XMLHttpRequest();
            request.open('GET', '/api/results?' + Date.now(), true);
            request.send();

            request.onload = function() {
                if (request.status >= 200 && request.status < 400) {
                    var data = JSON.parse(request.responseText);
                    if (formContainer) {
                        hideForm();
                        showResults();
                    }

                    updateResults(data);
                }
            }
        },

        onVoteButtonClick: function(event) {
            var answer = document.querySelector('input[name="answer"]:checked');
            var value = answer.value;

            var request = new XMLHttpRequest();
            request.open('GET', '/api/vote/' + value + '?' + Date.now(), true);
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
            } else {
                setInterval(this.fetchResults, 6000);
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

    if(!hasRequirements() || (isIE() && isIE() < 9)) {
        return false;
    }

    patchConsole();

    if('WebSocket' in window) {
        websockets.init();
    } else {
        ajax.init();
    }

    addClass(document.querySelector('html'), 'js');
}());
