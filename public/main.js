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
var name, email;
var score = 0;
var ghost;
var wisps = [];
var startingY = 40;

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
                alert('This account is no enabled. Please contact support.')
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
}
Ghost.prototype.draw = function () {
    document.getElementById("game").children[0].insertAdjacentHTML("beforeend", "<img id='"+ this.id +"' src='images/ghost-" + this.color + ".png'>");
    this.element = document.getElementById(this.id);
    this.element.style.top = this.y + "%";
    this.element.style.left = this.x + "%";

}
Ghost.prototype.jump = function () {
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
}

Ghost.prototype.moveRight = function () {
    var currentGhost = this;
    var gameScreenWidth = document.getElementById("game").children[0].clientWidth;
    var ghostSize = currentGhost.element.clientWidth / gameScreenWidth * 100; // as a percent of the screen

    var rightIntervalId = setInterval(function () {
        if (currentGhost.x + ghostSize + 0.4 < 100) {
            currentGhost.x += 0.4;
            currentGhost.element.style.left = currentGhost.x + "%";
        } else {
            clearInterval(rightIntervalId);
        }
    }, 10)

    document.body.onkeyup = function (e) {
        if (e.keyCode == 39) {
            clearInterval(rightIntervalId);
        }
    }
}

Ghost.prototype.moveLeft = function () {
    var currentGhost = this;

    var leftIntervalId = setInterval(function () {
        if (currentGhost.x - 0.4 > 0) {
            currentGhost.x -= 0.4;
            currentGhost.element.style.left = currentGhost.x + "%";
        } else {
            clearInterval(leftIntervalId);
        }
    }, 10)

    document.body.onkeyup = function (e) {
        if (e.keyCode == 37) {
            clearInterval(leftIntervalId);
        }
    }
}

function Wisp(color, x, y, id) {
    this.color = color;
    this.x = x;
    this.y = y;
    this.id = id;
    this.element;
}

Wisp.prototype.draw = function () {
    document.getElementById("game").children[0].insertAdjacentHTML("beforeend", "<img id='" + this.id + "' class='wisp' src='images/wisp-" + this.color + ".png'>");
    this.element = document.getElementById(this.id);
    this.element.style.top = this.y + "%";
    this.element.style.left = this.x + "%";
}
Wisp.prototype.move = function () {
    var currentWisp = this;
    setInterval(function () {
        currentWisp.x -= 0.13;
        currentWisp.element.style.left = currentWisp.x + "%";

    }, 10);
}


/* this.x = x * document.getElementById("game").children[0].clientWidth;
this.y = y * document.getElementById("game").children[0].clientHeight; */

document.getElementById("start").onclick = function () {
    document.getElementById("start").style.display = "none";

    document.body.onkeydown = function (e) {
        if (e.keyCode == 32) {
            ghost.jump();
        }
        if (e.keyCode == 39) {
            ghost.moveRight();
        }
        if (e.keyCode == 37) {
            ghost.moveLeft();
        }
        if (e.keyCode == 38) {
            ghost.jump();
        }
    }

    for (let i = 0; i < wisps.length; i++) {
        wisps[i].move();
    }


}


function initApp() {
    ghost = new Ghost("white", 5, startingY, "ghost");
    ghost.draw();


    wisps.push(new Wisp("white", 40, startingY, "wisp" + wisps.length));
    wisps[0].draw();


    var gameScreenWidth = document.getElementById("game").children[0].clientWidth;

    while (wisps[wisps.length - 1].x / 100 * gameScreenWidth + 300 < gameScreenWidth) {
        var previousWispX = wisps[wisps.length - 1].x;
        wisps.push(new Wisp("white", previousWispX + 300 / gameScreenWidth * 100, startingY, "wisp" + wisps.length));
        wisps[wisps.length - 1].draw();
    }




    firebase.auth().onAuthStateChanged(function (user) {

        if (user && user.emailVerified) {
            document.getElementById("loginOpen").style.display = "none";
            document.getElementById("signupOpen").style.display = "none";
            document.getElementById("userOpen").style.display = "block";
            document.querySelector("#userOpen").innerHTML = '<span class="fa fa-user"></span>' + "&nbsp;&nbsp;" + user.displayName; // dont think this should be an isue?
            name = user.displayName;
            email = user.email;

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