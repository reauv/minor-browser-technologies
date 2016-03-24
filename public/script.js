(function() {
    var results = document.querySelector('#results');
    var content = document.querySelector('#content');
    var voteButton = document.querySelector('#vote');

    if(results) {
        setInterval(fetchResults, 6000);
    }

    if(voteButton) {
        voteButton.addEventListener('click', function(event) {
            var answer = document.querySelector('input[name="answer"]:checked');
            var value = answer.value;

            var request = new XMLHttpRequest();
            request.open('GET', '/api/vote/' + value, true);
            request.send();

            request.onload = function () {
                if (request.status >= 200 && request.status < 400) {
                    fetchResults();
                    setInterval(fetchResults, 6000);
                }
            }

            event.preventDefault();
        });
    }

    function fetchResults() {
        var request = new XMLHttpRequest();
        request.open('GET', '/api/html/results', true);
        request.send();

        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                content.innerHTML = request.responseText;
            }
        }
    }
}());
