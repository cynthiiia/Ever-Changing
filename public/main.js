var firebaseConfig = {
    apiKey: "AIzaSyAqNbrXvFYFI_7s8BrytqE5TdgN2GuMWk4",
    authDomain: "ever-changing.firebaseapp.com",
    databaseURL: "https://ever-changing.firebaseio.com",
    projectId: "ever-changing",
    storageBucket: "ever-changing.appspot.com",
    messagingSenderId: "1046555603180",
    appId: "1:1046555603180:web:364f4419ecec6be7"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
//Firestore
var db = firebase.firestore();
//Firebase Authenticator
var auth = firebase.auth();

//User Data
var name, email, userId;
var score = 0;
var highscore = 0;
var ghost;
var wisps = [];
var colors = ["white", "pink", "blue", "green", "purple"];
var startingY = 25;
var rightFired = false;
var leftFired = false;
var upFired = false;
var downFired = false;
var gameover = false;
var countdownCycles = 0;
var timeBetweenChange = 9;

//Navbar signup/signout and login action
document.getElementById("signupOpen").onclick = function () {
    if (document.getElementById("signupForm").style.display == "block") {
        document.getElementById("signupForm").style.display = "none";

    } else {
        document.getElementById("signupForm").style.display = "block";
        document.getElementById("loginForm").style.display = "none";
    }
}
document.getElementById("signupCancel").onclick = function () {
    document.getElementById("signupForm").style.display = "none";
}

document.getElementById("loginOpen").onclick = function () {
    if (document.getElementById("loginForm").style.display == "block") {
        document.getElementById("loginForm").style.display = "none";

    } else {
        document.getElementById("loginForm").style.display = "block";
        document.getElementById("signupForm").style.display = "none";
    }
}
document.getElementById("loginCancel").onclick = function () {
    document.getElementById("loginForm").style.display = "none";
}

document.getElementById("userOpen").onclick = function () {
    if (document.getElementById("userForm").style.display == "block") {
        document.getElementById("userForm").style.display = "none";

    } else {
        document.getElementById("userForm").style.display = "block";
    }
}


// Email checker for signups
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // check this
    var signupFormEmailWarning = document.querySelector("#signupForm .form-container").children[7];
    signupFormEmailWarning.textContent = "";

    if ((re.test(String(email).toLowerCase())) == false) {
        signupFormEmailWarning.textContent = "Please enter a valid email"; // Fix innerhtml issues
        return false;
    } else {
        return true;
    }
}
//Password checker for signups
function valiatePassword(password) {
    var re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    var signupFormPasswordWarning = document.querySelector("#signupForm .form-container").children[10];
    signupFormPasswordWarning.textContent = "";

    if (re.test(String(password)) == false) {
        signupFormPasswordWarning.textContent = "Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character";
        return false;
    } else {
        return true;
    }
}

// Signup write to database
document.getElementById("signupSubmit").onclick = function () {
    var signupFormBody = document.querySelector("#signupForm .form-container");
    var firstName = signupFormBody.querySelector('input[name="firstName"]').value;
    var lastName = signupFormBody.querySelector('input[name="lastName"]').value;
    var email = signupFormBody.querySelector('input[name="email"]').value;
    var password = signupFormBody.querySelector('input[name="password"]').value;


    if (validateEmail(email) & valiatePassword(password)) {

        auth.createUserWithEmailAndPassword(email, password).then(function () {
            document.getElementById("signupForm").style.display = "none";
            return firebase.auth().currentUser;
        }).then(function (user) {
            user.sendEmailVerification();

            db.collection("users").doc(user.uid).set({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    highscore: 0
                })
                .then(function () {
                    console.log("User added to database successfully");
                })
                .catch(function (error) {
                    console.error("Error adding user to database: ", error);
                });

            user.updateProfile({
                displayName: firstName + " " + lastName,
                email: email,
                emailVerified: false

            })
        }).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            if (errorCode == 'auth/email-already-in-use') {
                alert('The email address is already in use by another account.');
            } else if (errorCode == 'auth/invalid-email') {
                alert('Please enter a valid email. ');
            } else if (errorCode == 'auth/operation-not-allowed') {
                alert('This account is not enabled. Please contact support.')
            } else if (errorCode == 'auth/weak-password') {
                alert('Password is too weak.')
            }
            console.log(error);
        });

    }
}

// login write to database 
document.getElementById("loginSubmit").onclick = function () {
    var loginFormBody = document.querySelector("#loginForm .form-container");
    var loginEmail = loginFormBody.querySelector("input[name='email']").value;
    var loginPassword = loginFormBody.querySelector('input[name="password"]').value;


    firebase.auth().signInWithEmailAndPassword(loginEmail, loginPassword).then(function () {
        document.getElementById("loginForm").style.display = "none";
    }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;

        var loginFormWarning = document.querySelector("#loginForm .form-container").children[7];
        if (errorCode === 'auth/wrong-password') {
            loginFormWarning.textContent = "Username and/or password invalid.";

        } else if (errorCode === 'user-not-found') {
            loginFormWarning.textContent = "Username and/or password invalid.";

        } else if (errorCode == 'auth/user-disabled') {
            loginFormWarning.textContent = 'User is disabled. Please contact support';
        } else if (errorCode == 'auth/invalid-email') {
            loginFormBody.textContent = "Invalid email entered."
        }
    });
};

document.getElementById("logout").onclick = async function () {
    await firebase.auth().signOut();
    document.getElementById("userForm").style.display = "none";
    name, email = "";
    score = 0;
}

function Ghost(color, x, y, id) {
    this.color = color;
    this.x = x;
    this.y = y;
    this.id = id;
    this.element;
    this.interval = ["right", "left", "up", "down"];
}
Ghost.prototype.draw = function () {
    document.getElementById("game").children[0].insertAdjacentHTML("beforeend", "<img id='" + this.id + "' src='images/ghost-" + this.color + ".png'>");
    this.element = document.getElementById(this.id);
    this.element.style.top = this.y + "%";
    this.element.style.left = this.x + "%";

}
/* Ghost.prototype.jump = function () {
    var originalY = startingY;
    var currentGhost = this;
    if (currentGhost.y == originalY) {
        var upIntervalId = setInterval(function () {
            if (currentGhost.y > originalY - 30) {
                currentGhost.y -= 0.4;
                currentGhost.element.style.top = currentGhost.y + "%";
            } else if (currentGhost.y <= originalY - 30) {
                clearInterval(upIntervalId);
                var downIntervalId = setInterval(function () {
                    if (currentGhost.y < originalY) {
                        currentGhost.y += 0.4;
                        currentGhost.element.style.top = currentGhost.y + "%";
                    } else if (currentGhost.y >= originalY) {
                        clearInterval(downIntervalId);
                    }

                }, 10)
            }

        }, 10)
    }
} */

function backgroundShift(direction) {

    var currentBackgroundPosition = window.getComputedStyle(document.getElementById("game-container"), null).backgroundPosition.split(" ");
    currentBackgroundPosition[0] = parseFloat(currentBackgroundPosition[0].replace("px", ""));
    currentBackgroundPosition[1] = parseFloat(currentBackgroundPosition[1].replace("px", ""));


    if (direction == "right") {
        document.getElementById("game-container").style.backgroundPosition = (currentBackgroundPosition[0] - 0.5) + "px " + currentBackgroundPosition[1] + "px";
    } else if (direction == "left") {
        document.getElementById("game-container").style.backgroundPosition = (currentBackgroundPosition[0] + 0.5) + "px " + currentBackgroundPosition[1] + "px";
    } else if (direction == "up") {
        document.getElementById("game-container").style.backgroundPosition = (currentBackgroundPosition[0]) + "px " + (currentBackgroundPosition[1] + 0.5) + "px";
    } else if (direction == "down") {
        document.getElementById("game-container").style.backgroundPosition = (currentBackgroundPosition[0]) + "px " + (currentBackgroundPosition[1] - 0.5) + "px";
    }

}

Ghost.prototype.moveRight = function () {
    var currentGhost = this;
    var gameScreenWidth = document.getElementById("game").children[0].clientWidth;
    var ghostWidth = currentGhost.element.clientWidth / gameScreenWidth * 100; // as a percent of the screen; to prevent ghost from leaving the screen
    var xPercentToMove = 6 / gameScreenWidth * 100;

    var rightIntervalId = setInterval(function () {
        if (currentGhost.x + ghostWidth + xPercentToMove < 100) {
            currentGhost.x += xPercentToMove;
            currentGhost.element.style.left = currentGhost.x + "%";
            backgroundShift("right");
        } else {
            clearInterval(rightIntervalId);
            rightFired = false;
        }
    }, 10)
    this.interval[0] = rightIntervalId;
}

Ghost.prototype.moveLeft = function () {
    var currentGhost = this;
    var gameScreenWidth = document.getElementById("game").children[0].clientWidth;
    var xPercentToMove = 6 / gameScreenWidth * 100;

    var leftIntervalId = setInterval(function () {
        if (currentGhost.x - xPercentToMove > 0) {
            currentGhost.x -= xPercentToMove;
            currentGhost.element.style.left = currentGhost.x + "%";
            backgroundShift("left");
        } else {
            clearInterval(leftIntervalId);
            leftFired = false;
        }
    }, 10)
    this.interval[1] = leftIntervalId;

}

Ghost.prototype.moveUp = function () {
    var currentGhost = this;
    var gameScreenHeight = document.getElementById("game").children[0].clientHeight;
    var yPercentToMove = 6 / gameScreenHeight * 100;

    var upIntervalId = setInterval(function () {
        if (currentGhost.y - yPercentToMove > 0) {
            currentGhost.y -= yPercentToMove;
            currentGhost.element.style.top = currentGhost.y + "%";
            backgroundShift("up");
        } else {
            clearInterval(upIntervalId);
            upFired = false;
        }
    }, 10)
    this.interval[2] = upIntervalId;


}

Ghost.prototype.moveDown = function () {
    var currentGhost = this;
    var gameScreenHeight = document.getElementById("game").children[0].clientHeight;
    var ghostHeight = currentGhost.element.clientHeight / gameScreenHeight * 100; // as a percent of the screen; to prevent ghost from leaving the screen
    var yPercentToMove = 6 / gameScreenHeight * 100; // take 0.6% of the Width of the screen and divide it by the height to move the same amount as left and right

    var downIntervalId = setInterval(function () {
        if (currentGhost.y + yPercentToMove + ghostHeight < 100) {
            currentGhost.y += yPercentToMove;
            currentGhost.element.style.top = currentGhost.y + "%";
            backgroundShift("down");
        } else {
            clearInterval(downIntervalId);
            downFired = false;
        }
    }, 10)
    this.interval[3] = downIntervalId;
}

Ghost.prototype.changeColor = function () {

    var randColor = colors[Math.floor(Math.random() * colors.length)]; // choose a random color first 
    while (randColor == this.color) {
        randColor = colors[Math.floor(Math.random() * colors.length)];
    }
    this.color = randColor;
}

function Wisp(color, id, value, countdownCycles) {
    this.color = color;
    this.value = value;
    this.changePositionDirection();
    this.changeSpeed(countdownCycles);
    this.id = id;
    this.element;
    this.interval;
}
Wisp.prototype.changeSpeed = function (countdownCycles) {
    // setting the speed in pixels for consistent movement speed, not dependent on game screen width
    if (countdownCycles <= 10) {
        this.speedX = (Math.random() * (1) + 1.5 + 0.2 * (countdownCycles));
        this.speedY = (this.speedX);

    }
}
Wisp.prototype.changePositionDirection = function () {
    // Position
    this.x = Math.random() * (150 - (-50)) - 50;
    this.y = Math.random() * (150 - (-50)) - 50;
    while ((0 <= this.x && this.x <= 100) && (0 <= this.y && this.y <= 100)) {
        this.x = Math.random() * (150 - (-50)) - 50;
        this.y = Math.random() * (150 - (-50)) - 50;
    }
    // setting  direction
    if (this.x < 30 && !(this.y >= 30 && this.y <= 70)) { // left side top and bottom
        this.xDirection = "right";
        this.yDirection = this.y < 30 ? "down" : "up"
    } else if (this.x > 70 && !(this.y >= 30 && this.y <= 70)) { // right side top and bottom 
        this.xDirection = "left";
        this.yDirection = this.y < 30 ? "down" : "up"
    } else if ((this.x >= 30 && this.x <= 70) && !(this.y >= 0 && this.y <= 100)) { // top and bottom horizontal area
        this.xDirection = Math.floor(Math.random() * 3) == 0 ? "none" : (Math.floor(Math.random() * 2) == 0 ? "left" : "right");
        this.yDirection = this.y < 0 ? "down" : "up"
    } else if (!(this.x >= 30 && this.x <= 70) && (this.y >= 0 && this.y <= 100)) { // left and right side vertical areas 
        this.yDirection = Math.floor(Math.random() * 3) == 0 ? "none" : (Math.floor(Math.random() * 2) == 0 ? "down" : "up");
        this.xDirection = this.x < 0 ? "right" : "left"

    }
}

Wisp.prototype.draw = function () {
    document.getElementById("game").children[0].insertAdjacentHTML("beforeend", "<img id='" + this.id + "' class='wisp' src='images/wisp-" + this.color + ".png'>");
    this.element = document.getElementById(this.id);
    this.element.style.top = this.y + "%";
    this.element.style.left = this.x + "%";
}
Wisp.prototype.move = function () {
    var currentWisp = this;

    this.interval = setInterval(function () {
        var gameScreenWidth = document.getElementById("game").children[0].clientWidth;
        var gameScreenHeight = document.getElementById("game").children[0].clientHeight;

        if (currentWisp.xDirection == "left") {
            currentWisp.x -= currentWisp.speedX / gameScreenWidth * 100;
            currentWisp.element.style.left = currentWisp.x + "%";

        } else if (currentWisp.xDirection == "right") {
            currentWisp.x += currentWisp.speedX / gameScreenWidth * 100;
            currentWisp.element.style.left = currentWisp.x + "%";

        }
        if (currentWisp.yDirection == "up") {
            currentWisp.y -= currentWisp.speedY / gameScreenHeight * 100;
            currentWisp.element.style.top = currentWisp.y + "%";

        } else if (currentWisp.yDirection == "down") {
            currentWisp.y += currentWisp.speedY / gameScreenHeight * 100;
            currentWisp.element.style.top = currentWisp.y + "%";

        }

    }, 10);
}


/* this.x = x * document.getElementById("game").children[0].clientWidth;
this.y = y * document.getElementById("game").children[0].clientHeight; */
Wisp.prototype.changeColor = function (prefColor) {

    var nonPrefColors = colors.filter(function (color) {
        return color != prefColor;
    });
    var rearrangedColors = [prefColor];
    rearrangedColors = rearrangedColors.concat(nonPrefColors);

    var randNum = Math.random();
    if (randNum <= 0.8) {
        this.color = rearrangedColors[0];
    } else if (randNum <= 0.85) {
        this.color = rearrangedColors[1];
    } else if (randNum <= 0.90) {
        this.color = rearrangedColors[2];
    } else if (randNum <= 0.95) {
        this.color = rearrangedColors[3];
    } else if (randNum <= 1.00) {
        this.color = rearrangedColors[4];
    }
}


function setup() {
    ghost = new Ghost("white", 45, startingY, "ghost");
    ghost.draw();

    for (let i = 0; i < 5; i++) {
        wisps.push(new Wisp("white", "wisp" + wisps.length, 10, countdownCycles));
        wisps[i].draw();
    }
}



document.getElementById("start").onclick = function () {
    // set display of the elements that are not needed to none
    document.getElementById("start").style.opacity = "0";
    document.getElementById("start").style.visibility = "hidden";
    document.getElementById("gameover-div").style.opacity = "0";
    document.getElementById("gameover-div").style.visibility = "hidden";

    document.getElementById("highscore").classList.remove("animated-new-highscore");
    document.getElementById("highscore-label").classList.remove("animated-new-highscore");

    document.getElementById("score").children[0].children[0].textContent = 0;
    score = 0;

    // set up the the movement for the ghost
    document.body.onkeydown = function (e) {
        /*         if (e.keyCode == 32) {
                    ghost.jump();
                } */
        if (e.keyCode == 39 && rightFired == false && leftFired == false) {
            rightFired = true;
            ghost.moveRight();
        }
        if (e.keyCode == 37 && leftFired == false && rightFired == false) {
            leftFired = true;
            ghost.moveLeft();
        }
        if (e.keyCode == 38 && downFired == false && upFired == false) {
            upFired = true;
            ghost.moveUp();
        }
        if (e.keyCode == 40 && downFired == false && upFired == false) {
            downFired = true;
            ghost.moveDown();
        }
    }


    document.body.onkeyup = function (e) {
        if (e.keyCode == 39) {
            clearInterval(ghost.interval[0]);
            rightFired = false;
        }
        if (e.keyCode == 37) {
            clearInterval(ghost.interval[1]);
            leftFired = false;
        }
        if (e.keyCode == 38) {
            clearInterval(ghost.interval[2]);
            upFired = false;
        }
        if (e.keyCode == 40) {
            clearInterval(ghost.interval[3]);
            downFired = false;
        }
    }

    //set up movement for the wisps
    for (let i = 0; i < wisps.length; i++) {
        wisps[i].move();
    }

    document.querySelector("#game .col-12 h5").className += " animated-shrink-text";
    var ghostColorCountdown = setInterval(function () {
        var countdown = document.querySelector("#game .col-12 h5");

        // Animation using transitions - works but laggy
        /* var firstVersion = countdown.classList.contains("animated-shrink-text");
        if (countdown.classList.contains("animated-shrink-text")) {
            countdown.classList.remove("animated-shrink-text");

        } else if (countdown.classList.contains("animated-shrink-text-2")) {
            countdown.classList.remove("animated-shrink-text-2");
        };
        setTimeout(function() {
            if (firstVersion) {
                countdown.className += "animated-shrink-text-2";
    
            } else if (!firstVersion) {
                countdown.className += "animated-shrink-text";
            }

        },1); */

        // Increment seconds elapsed counter


        var currentTime = countdown.textContent;

        if (currentTime == "0") {
            countdownCycles += 1;
            if ((countdownCycles % 1) == 0 && countdownCycles < 5) {
                timeBetweenChange -= 1;
                wisps.push(new Wisp("white", "wisp" + wisps.length, 10, countdownCycles));
                wisps[wisps.length - 1].draw(); // fix error when game is overand increase speed of the ghosts 
                wisps[wisps.length - 1].move();
            }
            // Redraw the ghost if countdown hits 0
            ghost.changeColor();
            ghost.element.parentElement.removeChild(ghost.element);
            ghost.draw();

        }

        var newTime = currentTime == "0" ? (timeBetweenChange).toString() : (parseInt(currentTime) - 1).toString(); //animating countdown?TO DO 
        countdown.textContent = newTime;

    }, 1000);

    // set up every 9 seconds the ghost will change colour
    /*     var ghostColorInterval = setInterval(function () {
            // Redraw the ghost
            ghost.changeColor();
            ghost.element.parentElement.removeChild(ghost.element);
            ghost.draw();
        }, 9000) */
    /* var ghostColorChange = function () {
        // Redraw the ghost
        ghost.changeColor();
        ghost.element.parentElement.removeChild(ghost.element);
        ghost.draw();
        if (countdownCycles % timeBetweenChange == 0 && countdownCycles < 17) {
            timeBetweenChange -= 1000;
        }
        ghostColorInterval = setTimeout(ghostColorChange, timeBetweenChange);
    }
    var ghostColorInterval = setTimeout(ghostColorChange, timeBetweenChange); */

    //set up every 10 ms there will be a check if the wisps and ghost are touching, and checks if its the same colour or not and handles it. also checks if the wisps are out of screen
    var gameScreenWidth = document.getElementById("game").children[0].clientWidth;
    var gameScreenHeight = document.getElementById("game").children[0].clientHeight;

    var ghostWidth = ghost.element.clientWidth / gameScreenWidth * 100; // as a percent of the screen
    var ghostHeight = ghost.element.clientHeight / gameScreenHeight * 100; // as a percent of the screen

    var wispsInterval = setInterval(function () {
        var numOfIterations = wisps.length;
        for (let i = 0; i < numOfIterations; i++) {
            var wispWidth = wisps[i].element.clientWidth / gameScreenWidth * 100; // as a percent of the screen
            var wispHeight = wisps[i].element.clientHeight / gameScreenHeight * 100; // as a percent of the screen
            // var wispHeight = wisps[i].element.clientHeight / gameScreenWidth * 100; // as a percent of the screen

            if (ghost.x + ghostWidth >= (wisps[i].x + wispWidth * 0.15) && ghost.x <= (wisps[i].x + wispWidth * 0.85) && ghost.y + ghostHeight >= (wisps[i].y + wispHeight * 0.25) && ghost.y <= (wisps[i].y + wispHeight * 0.75) && ghost.color == wisps[i].color) {
                //update the score
                score += wisps[i].value;
                document.getElementById("score").children[0].children[0].textContent = score;

                //shift the wisp object to the back and fix the iterations of the loop
                var removedWisps = wisps.splice(i, 1);
                wisps = wisps.concat(removedWisps);
                numOfIterations -= 1;
                i -= 1;

                // redraw the wisp to the end
                wisps[wisps.length - 1].element.parentElement.removeChild(wisps[wisps.length - 1].element);
                wisps[wisps.length - 1].changePositionDirection();
                wisps[wisps.length - 1].changeSpeed(countdownCycles);
                wisps[wisps.length - 1].changeColor(ghost.color);
                wisps[wisps.length - 1].draw();

            } else if (ghost.x + ghostWidth >= (wisps[i].x + wispWidth * 0.15) && ghost.x <= (wisps[i].x + wispWidth * 0.85) && ghost.y + ghostHeight >= (wisps[i].y + wispHeight * 0.25) && ghost.y <= (wisps[i].y + wispHeight * 0.75) && ghost.color != wisps[i].color) {
                //gameover = true;
                clearInterval(wispsInterval);
                //clearInterval(ghostColorInterval);
                clearInterval(ghostColorCountdown);
                countdownCycles = 0;
                timeBetweenChange = 9;
                for (let i = 0; i < wisps.length; i++) {
                    clearInterval(wisps[i].interval);
                }

                for (let i = 0; i < wisps.length; i++) {
                    wisps[i].element.parentElement.removeChild(wisps[i].element);
                }
                ghost.element.parentElement.removeChild(ghost.element);

                ghost = null;
                wisps = [];

                document.querySelector("#game .col-12 h5").textContent = "9"; // fix this  - fixed
                document.querySelector("#game .col-12 h5").classList.remove("animated-shrink-text")

                //Reset the background position
                document.getElementById("game-container").style.backgroundPosition = "0px 0px";
                // other things: increasing dfficulty - done and fixing ghosts (spawning, direction, colours etc) - done then saving scores - done
                // big countdown in the background and fix up down - done and done
                setup();

                if (email) {
                    db.collection("users").doc(userId).get().then(function (user) {
                        var savedHighscore = user.data().highscore;

                        if (savedHighscore >= score) {
                            document.getElementById("highscore").textContent = savedHighscore;

                        } else {
                            db.collection("users").doc(userId).set({
                                highscore: score
                            });
                            document.getElementById("highscore").textContent = score;
                            document.getElementById("highscore").className += " animated-new-highscore";
                            document.getElementById("highscore-label").className += " animated-new-highscore";
                        }
                        document.getElementById("gameover-div").style.opacity = "1";
                        document.getElementById("gameover-div").style.visibility = "visible";
                        document.getElementById("start").style.opacity = "1";
                        document.getElementById("start").style.visibility = "visible";


                    })

                } else {
                    if (score > highscore) {
                        highscore = score;

                        document.getElementById("highscore").className += " animated-new-highscore";
                        document.getElementById("highscore-label").className += " animated-new-highscore";
                    }
                    document.getElementById("highscore").textContent = highscore;

                    document.getElementById("gameover-div").style.opacity = "1";
                    document.getElementById("gameover-div").style.visibility = "visible";
                    document.getElementById("start").style.opacity = "1";
                    document.getElementById("start").style.visibility = "visible";
                }
                document.getElementById("currentScore").textContent = score;
                break;


            } else if (wisps[i].x < -10 || wisps[i].x > 110 || wisps[i].y < -10 || wisps[i].y > 110) { // fix this werid thing to redraw items that move out of the screen 
                //shift the wisp object to the back and fix the iterations of the loop
                var removedWisps = wisps.splice(i, 1);
                wisps = wisps.concat(removedWisps);
                numOfIterations -= 1;
                i -= 1;


                // redraw the wisp to the end
                wisps[wisps.length - 1].element.parentElement.removeChild(wisps[wisps.length - 1].element);
                wisps[wisps.length - 1].changePositionDirection();
                wisps[wisps.length - 1].changeSpeed(countdownCycles);
                wisps[wisps.length - 1].changeColor(ghost.color);
                wisps[wisps.length - 1].draw();

            }

        }

    }, 10);
}


function initApp() {
    setup();

    firebase.auth().onAuthStateChanged(function (user) {

        if (user && user.emailVerified) {
            document.getElementById("loginOpen").style.display = "none";
            document.getElementById("signupOpen").style.display = "none";
            document.getElementById("userOpen").style.display = "block";
            document.querySelector("#userOpen").innerHTML = '<span class="fa fa-user"></span>' + "&nbsp;&nbsp;" + user.displayName; // dont think this should be an isue?
            name = user.displayName;
            email = user.email;
            userId = user.uid;


        } else if (user && !(user.emailVerified)) {
            document.getElementById("loginOpen").style.display = "block";
            document.getElementById("signupOpen").style.display = "block";
            document.getElementById("userOpen").style.display = "none";
            firebase.auth().signOut();
            alert("Please verify your email.");

        } else if (!user) {
            document.getElementById("loginOpen").style.display = "block";
            document.getElementById("signupOpen").style.display = "block";
            document.getElementById("userOpen").style.display = "none";
        }
    })
}


window.onload = function () {
    initApp();

}