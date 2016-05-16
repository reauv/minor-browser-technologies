# Browser technologies

For the course browser technologies of the minor web development I've researched
& built a poll that uses progressive enhancement to make it accessible for everyone.

## Browser feature: WebSockets!
The awesome browser feature that I'll be using to enhance the application is
WebSockets. They are a feature in browser that allow the browser to set up a
connection with a server that, rather than regular HTTP requests do not close
or end after the request has been rejected or fulfilled but remain open for
communication. Both parties will be able to _push_ messages to the other, making
real time communication possible in a quick, efficient way. In our application
we can use this to push new results to the user without having them refresh the
browser or poll the server. Awesome!

## Progressive Enhancement
It uses 3 layers of _progressive enhancement_ to make sure everyone can use the
core feature: voting & displaying the results.

#### Vanilla HTML/CSS
If your browser doesn't support JS, your browser does not support the parts of
JS that the script requires or JS is just disabled, you'll be served a vanilla
HTML/CSS form that just submits a POST request to the server, after that you'll
see the results. For showing the most recent results, I use the `<meta http-equiv="refresh">`
element to refresh the page and show the most recent results.

#### JavaScript
When there is JavaScript available, and it supports our requirements, right now
that is IE9 or higher and/or suppot for querySelector and fn.bind, we can enhance
the experience with AJAX requests for casting the vote & polling the result every
X seconds and update the results live without reloading the page. And if there is
support for CSS transitions you get a fancy transition for free.

#### WebSockets
Even with AJAX requests, the results aren't really live because we are just polling
every X seconds to get the latest results from the server. It would be much cooler
(and efficient) if the server would push the latest results to us when there is a new
vote cast. Well, that's possible with WebSockets! Right now we are using the final implementation
so the support is not that good on the IE part (only MS Edge) but the most major browser have
implemented the final WebSockets spec for a while. The experience for the end-user is mostly
the same as with the AJAX requests, but this time it's really live!

## Research
I worked with WebSockets some while ago so I did have some knowledge
and experience with it before I started working on this project. To fresh up
my memory I visited the WebSocket API page on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).
For the server side I searched for a Node.js implementation and found [one](https://github.com/theturtle32/WebSocket-Node)
that had a good amount of stars and well explaning examples and documentation.
Other than that I did not have to do much research, it was not hard for me to figure out how
I wanted to implement the three layers of progressive enhancement. Only problem I ran into
was how to recognize WebSockets client to see if they already voted because you can't use
cookies with WebSocket connections. A tip on StackOverflow suggested using the query parameters
of the connection to pass the ID of the client from the cookie.

## Demo
http://browser.rovansteen.nl

## Browser support

### JavaScript (AJAX requests)
* Chrome 1+
* Firefox 1+
* IE9+
* Opera 1+
* Safari 1.2+

### Websockets
* Chrome 16+
* Firefox 11+
* Edge+
* Opera 12.1+
* Safari 7.0+

### Accessibility
Because the poll form and results are relatively simple in terms of interaction
and displaying data to the end-user the accessibility is good. The form uses
native form elements and is therefore accessible for everyone. The displaying
of the results is just an unordered list, so nothing special there. The colors
used for the bar is just an enhancement and doesn't have any meaning. The width
of the bar indicates the amount of votes. For people that are not able to see the bar
the amount of votes and the percentage is also in text. To improve the accessibilty
I also added `aria-live` attribute to the list of results so that screen readers
can notify the user when the results are updated.

