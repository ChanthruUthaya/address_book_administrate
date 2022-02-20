"use strict";

//form elements
const organisationForm = document.getElementById('Organisation');
const peopleForm = document.getElementById('people')


//form listner
organisationForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this); //data from form
    const searchParams = new URLSearchParams(); //params to add to request body
    
    for (const pair of formData){
        searchParams.append(pair[0], pair[1]); //each key and value of entered data
    }

    fetch('/db/organisation', { // fetch request
        method: 'post',
        body:searchParams
    }).then(response => response.json()).then(data => {
        if(data.message == "Name OK"){ //if check successful and successfully added to database
            document.getElementById('response_org').innerHTML = "Successfully Added";
            organisationForm.reset();
        }
        else{
            document.getElementById('response_org').innerHTML = data.message;
        }
    })
})


//people form button listner
peopleForm.addEventListener('submit', function(event){
    event.preventDefault();

    const formData = new FormData(this);
    const searchParams = new URLSearchParams();

    for (const pair of formData){
        searchParams.append(pair[0], pair[1]);
    }

    fetch('/db/member', {
        method: 'post',
        body:searchParams
    }).then(response => response.json()).then(data => {
        if(data.message == "OK"){
            document.getElementById('response_p').innerHTML = "Successfully Added";
            peopleForm.reset();
        }
        else{
            document.getElementById('response_p').innerHTML = data.message;
        }
    })
})