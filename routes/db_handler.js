const express = require('express');
const handler = express.Router(); //create router

const db = require('../db_config.js'); //database connection

// map from user form datanames to column names in people database
const user_column_map = {
    "name_p":"NAME",
    "lastName":"LAST_NAME",
    "address" : "ADDRESS",
    "email_p" : "EMAIL",
    "Phone":"PHONE",
    "org": "ORGANISATION"
}

//map from table column name to check function 
var people_func_map = {
    "NAME":check_names,
    "LAST_NAME":check_names,
    "ADDRESS":check_address,
    "PHONE":check_number

}

//route handler for getting all data
handler.get('/getall', async (req, res) =>{
    //json dict object for data from each table
    data = {
        organisation: null,
        people: null,
    }
    //sql query to get all data from people table
    var people = await get_all('SELECT * FROM people').then((rows)=>{
            if(rows == undefined){
                return null;
            }
            else{
                return rows
            }
        }).catch((err)=>console.log(err.message));
    data.people = people; //add to data dict
    //sql query for getting data from organisation table
    var organisations = await get_all('SELECT * FROM organisations').then((rows)=>{
            if(rows == undefined){
                return null;
            }
            else{
                return rows
            }
        }).catch((err)=>console.log(err.message));
    data.organisation = organisations;
    res.status(200).json(data);
})


//handler for adding organisation to database
handler.post('/organisation', async function(req, res){
    const obj = JSON.parse(JSON.stringify(req.body)); //get form data from req body
    errorlist = ["Name OK"]; //initialise error check array to send back to client if checks fail
    var params = [obj.name_org, obj.email_org] //add parameters for sql query
    let placeholders = params.map((param)=> '?').join(',');
    let sql = 'INSERT INTO organisations (NAME, EMAIL) VALUES' + `(${placeholders})` //sql query string
    //check name not already taken
    await countcheckpromise(obj.name_org, 'Name', 'organisations').then((result)=>{
        if(result > 0){
            console.log("Organisation Taken");
            errorlist.unshift("Invalid Input, Organisation name already taken"); //add error to error lost 
        }
    });
    if(errorlist.length == 1){
        //if no errors insert into table
        var response = await insertMember(sql, params, errorlist).catch((err) => alert(err))
        //send response message
        res.status(200).json(response)
        console.log("Inserted new organisation")
    }
    else{
        res.json({message:`${errorlist[0]}`})
    }
})

//route handler to add member to people table
handler.post('/member', async function(req, res){
    const obj = JSON.parse(JSON.stringify(req.body));
    var params = [];
    var errorlist = ["OK"]; //user input error array
    //error checks for user input
    errorlist.unshift(check_names(obj["name_p"],"NAME"))
    errorlist.unshift(check_names(obj["lastName"], "LAST_NAME"))
    errorlist.unshift(check_address(obj["address"]))
    errorlist.unshift(check_number(obj["Phone"]))
    errorlist = [].concat.apply([], errorlist)
    if(errorlist.length == 1){ //if no issuses with user input
        let errors = ["OK"] //error array for if data already taken
        let allowed = ["ORGANISATION", "NAME", "LAST_NAME"] //allowed repeat data fields
        for (var key in obj){
            if (obj.hasOwnProperty(key)){
                //for each data in body add value to sql parameters
                params.push(obj[key]);
                let column = user_column_map[key] //column in table to check
                let table = "people"
                if(!allowed.includes(column)){ //columns to check
                    await countcheckpromise(obj[key],column,table).then((result) =>{
                        if(result>0){
                            errors.unshift(`${column} Already exists`) //error if exists
                        }
                    })
                }
                else if(column == "ORGANISATION"){ //check to make sure organisation exists
                    await countcheckpromise(obj[key],"NAME","organisations").then((result) =>{
                        if(result<1){
                            errors.unshift(`${column} doesnt exist`)
                        }
                    })
                }

            }
        }
        if(errors.length == 1){ //if no errors add to db
            var columns = "NAME, LAST_NAME, ADDRESS, EMAIL, PHONE, ORGANISATION";
            let placeholders = params.map((param)=> '?').join(',');
            let sql = `INSERT INTO people (${columns}) VALUES (${placeholders})`;
            await insertMember(sql, params, errorlist).catch((err)=>errors.unshift(err.message));
        }
        res.status(200).json({message:errors[0]}); //response
    }
    else{
        res.json({message:errorlist[0]}) //response
    }
})

//handler funcition to delete entry
handler.delete('/delete' ,async function(req, res){
    const obj = JSON.parse(JSON.stringify(req.body))
    const table = obj.table //table to delete from
    const id = obj.id //id to delete
    const id_key_name = obj.id_name //name of id column
    const sql = `DELETE FROM ${table} WHERE (${id_key_name}) = (?)`
    await deleteEntry(sql, [id]).catch(err =>console.log(err.message))//deleteEntry
    if(table == "organisations"){ //if deleting organisation must delete all users part of organisation
        let sql_member = `DELETE FROM people WHERE (organisation) = (?)`
        await deleteEntry(sql_member, [id]).catch(err => console.log(err.message))
    }
    res.status(200).send("ok")
})

//handler to update an organisation in table
handler.put('/organisations', async(req, res)=>{
    const obj = JSON.parse(JSON.stringify(req.body))
    let table = obj["TABLE"] //table name
    let id = obj["ID"] //id to update
    delete obj["ID"] //delete entries
    delete obj["TABLE"]
    let sql = `UPDATE ${table} SET ` //constricting query string
    let form_str = []
    let params = [] //query string parameters
    for(key in obj){
        if(obj.hasOwnProperty(key)){
            form_str.push(`${key} = (?)`) //adding relevant parts to update to query string
            params.push(obj[key])
        }
    }
    params.push(id) 
    sql += form_str.join(",") + ` WHERE NAME = (?)` //final construction of query string
    if(params.length > 0){ //if update needed
        error_exists = ["OK"] //check error list 
        if(obj.hasOwnProperty("NAME")){ //check if organisation name already taken
            await countcheckpromise(obj["NAME"],"NAME","organisations").then((result) =>{
                if(result>0){
                    error_exists.unshift(`${key} Already exists`)
                }
            })
        }
        if(error_exists.length == 1 ){ //if no errors update
            let response = await updateEntry(sql,params).catch((err)=>console.log(err.message)) //update in 
            if(obj["NAME"] != id){ //if change to name use old id to locate in table
                //update organisation name for all people part of organisation 
                sql_user = `UPDATE people SET organisation = (?) WHERE organisation = (?)`  
                sql_user_params = [obj["NAME"], id]
                let user_response = await updateEntry(sql_user, sql_user_params).catch(err =>console.log(err.message))
                console.log(user_response)
            }
        console.log(response)
        }
        res.json({message:error_exists[0]})
    }
    res.status(200).send("OK")
})


//route handler for updating person details
handler.put('/people', async (req, res)=>{
    const obj = JSON.parse(JSON.stringify(req.body))
    let table = obj["TABLE"] //table to update
    let id = obj["PID"] //id to update
    delete obj["ID"]
    delete obj["PID"]
    delete obj["TABLE"]
    let sql = `UPDATE ${table} SET ` //query string construction
    let form_str = []
    let params = []
    let errors = ["OK"] //error checking for user input correctness
    for(key in obj){
        if(obj.hasOwnProperty(key)){
            form_str.push(`${key} = (?)`)
            params.push(obj[key])
            if(people_func_map.hasOwnProperty(key)){ //check function uses checkfunction map to find correct handler
                if(key == "NAME" || key == "LAST_NAME"){
                    errors.unshift(people_func_map[key](obj[key], key))
                }
                else{
                    errors.unshift(people_func_map[key](obj[key]))
                }
            }
            
        }
    }
    params.push(id)
    errors = [].concat.apply([], errors)
    console.log(errors)
    sql += form_str.join(",") + " WHERE PID = (?)"
    if(errors.length == 1 && params.length > 0){ //if no errors and there exisits an item to update
        let error_exists = ["OK"] //checking for already existing entry in table
        let allowed = ["ORGANISATION", "NAME", "LAST_NAME"]
        for(key in obj){
            if(obj.hasOwnProperty(key)){
                let table = "people"
                if(!allowed.includes(key)){
                    await countcheckpromise(obj[key],key,table).then((result) =>{
                        if(result>0){
                            error_exists.unshift(`${column} Already exists`)
                        }
                    })
                }
                else if(key == "ORGANISATION"){ //make sure organisation exisits if updating organisation
                    await countcheckpromise(obj[key],"NAME","organisations").then((result) =>{
                        if(result<1){
                            error_exists.unshift(`${key} doesnt exist`)
                        }
                    })
                }
            }
        }
        if(error_exists.length == 1){
            //update entry
            let response = await updateEntry(sql,params).catch((err)=>console.log(err.message))
        } 
        console.log(error_exists)
        res.status(200).json({message:error_exists[0]})
    }
    else{
        res.json({message:errors[0]})
    }
})


function get_all(sql){
    /*
    function for getting all data from database tables

    args:
        sql: string, sql string to query database with
    
    Returns:

        promise, response from database

    */
    return new Promise((resolve, reject) =>{
        db.all(sql, (err, row)=>{
            if(err){
                reject(new Error(err.message));
            }
            else{
                resolve(row);
            }
            });
        })
}


function countcheckpromise(item, column, table){
    /* 
    function to check the count of a particular entry in database table

    args: 
        item: string, item to check the count of
        column: string, column to check
        table: string, table to check
    
    returns:
        promise, result from query

    */

    //sql query string
    let sql = `SELECT COUNT(${column}) FROM ${table} WHERE ${column} = (?)`;
    return new Promise((resolve, reject) => {
        db.get(sql, [item],(err, result)=>{
            if(err){
                reject(new Error(err.message));
            }
            else{
                resolve(result[`COUNT(${column})`]);
            }
        })
    }) 
}

function insertMember(sql, params,errorlist){
    /*
    function to insert member into database

    params:
        sql: string, query string
        params: list, query string parameters
        errorlist: list, all errors so far
    
    returns: 
        promise, result of query

    */

    return new Promise((resolve, reject) =>{
        db.run(sql, params, function(err) {
            if (err) {
                reject({message:err.message});  //reject with the error

            }
            else{
                resolve({message:`${errorlist[0]}`}); //send back most recent error
            }
        })
    })
}

function deleteEntry(sql, params){
    /*
    function to delete entry from table 

    args:
        sql: string, query string
        params: list, query string parameters

    returns: 
        promise, result of query

    */
    return new Promise((resolve, reject) =>{
        db.run(sql, params, function (err){
            if(err){
                reject(new Error(err.message))
            }
            else{
                resolve("deleted entry")
            }
        })

    })
}

function updateEntry(sql, params){ // same as deleteEntry but reconstructed with new name for code readability
    console.log(sql, params)
    return new Promise((resolve, reject) =>{
        db.run(sql,params ,(err)=>{
            if(err){
                reject(new Error(err.message))
            }
            else{
                resolve("Updated entry")
            }

        })
    })
}


function check_names(name, type){
    /*
    function to check a name for correctness
    
    args:
        name: string, name to check
        type: string, either NAME OR lAST_NAME

    returns: 
        errors: list, list of all errors with string

    */

    let errors = [] //error list 
    var check = true //assume correct
    for(var i=0; i < name.length; i++){
        var char = name.charAt(i);
        if(!(/^[a-zA-Z- ]/).test(char)){ //test each character with regexp
            check = false //if check failed
        }
    } 
    if(check == false){
        errors.unshift(`Error, ${type} contains invalid character`) //add error to list
    }
    return errors
}

function check_number(number){
    /*
    function to check number for correctness

    args:
        number: string, number to check
    
    returns:
        errors: list, all errors

    */
    let errors = [] 
    var check = true
    for(var i=0; i < number.length; i++){
        var char = number.charAt(i);
        if(!(/^[0-9]/).test(char)){
            check = false
        }
    }
    if(check == false){
        errors.unshift("Error, Phone number contains invalid character")
    }
    return errors
}

function check_address(address){
    /*
    function to check the address for correctness

    args:
        address: string, address to check

    returns: 
        errors: list, list of all errors

    */
    let errors = []
    var check = true
    for(var i=0; i < address.length; i++){
        var char = address.charAt(i);
        if(!(/^[a-zA-Z0-9 ,-.]/).test(char)){
            check = false
        }
    }
    if(check == false){
        errors.unshift("Error, Address contains invalid character")
    }
    return errors
}

module.exports = handler;