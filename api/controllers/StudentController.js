/**
 * StudentController
 *
 * @description :: Server-side logic for managing students
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Client = require('node-rest-client').Client;
var client = new Client();
var endpoint = "http://localhost:1337/student"

// custom sort method to sort student list by last name
function SortByName(x, y) {
    if (y.last_name != null && y.last_name != undefined && x.last_name != null && x.last_name != undefined) {
        var First = x.last_name.toString().toLowerCase();
        var Second = y.last_name.toString().toLowerCase();
        return ((First < Second) ? -1 : ((First > Second) ? 1 : 0));
    }
}




module.exports = {

    /**
     * `StudentController.create()`
     */
    create: function (req, res) {

        if (req.method != "POST") {
            //if blank page is being displayed, then get data to populate the 'Majors' dropdown value
            client.get("http://localhost:1337/major", function (data, response) {
                return res.view('create', {
                    majors: data
                })
            }).on('error', function (err) {
                return res.view('create', {
                    error: {
                        message: "There was an error getting the major descriptions"
                    }
                });
            });
        } else {
            var args = {
                data: req.body,
                headers: {
                    "Content-Type": "application/json"
                }
            };
            client.post(endpoint, args, function (data, response) {
                // return res.view('create', {success: { message: "Record added successfully"}});
                if (response.statusCode != "201") {
                    req.addFlash("error", data.message.substring(data.message.indexOf("•")));
                    return res.redirect('/create');
                    //return res.view('create');
                } else {
                    req.addFlash("success", "Record created successfully");
                    return res.redirect('/create');

                }
            })
        }
    },


    /**
     * `StudentController.read()`
     */
    read: function (req, res) {

        client.get(endpoint, function (data, response) {
            return res.view('read', {
                students: data
            });
        }).on('error', function (err) {
            return res.view('read', {
                error: {
                    message: "There was an error getting the students"
                }
            });
        });

    },


    /**
     * `StudentController.update()`
     */
    update: function (req, res) {

        if (req.method != "POST") {

        let majors;
        // create a promise so the page doesn't try to load before the majors are returned
        // the data returned by this call will be used to populate the 'Majors' drop down list
        let p1 = new Promise(
            (resolve, reject) => {
                client.get("http://localhost:1337/major", function (data, response) {
                    majors = data;
                });
            }
        )

        // don't try to get the student data until know the majors data has come back
        // which is when the majors data promise has been resolved
        p1.then(

                client.get(endpoint, function (data, response) { 
                    // sort the students returned so they are in order in dropdown on page                 
                    data.sort(SortByName);
                    return res.view('update', {
                        students: data,
                        majors: majors
                    });
                }).on('error', function (err) {
                    return res.view('update', {
                        error: {
                            message: "There was an error getting the students"
                        }
                    });
                })
            );


        } else {

            // remove the student id from the object because can't update the primary key when the update is posted
            let studentId = req.body.student_id;
            delete req.body.student_id;

            // remove any properties from the object that are null so we don't try post null values to db
            for (var propt in req.body) {
                if (req.body[propt] == "") {
                    //delete req.body[propt];
                    req.body[propt] = null;
                }
            }

            var args = {
                data: req.body,
                headers: {
                    "Content-Type": "application/json"
                }
            };

            client.put(endpoint + "/" + studentId, args, function (data, response) {

                if (response.statusCode != "200") {
                    req.addFlash("error", data.message);
                    return res.redirect('/update');
                }

                req.addFlash("success", "Record updated successfully");
                return res.redirect('/update');

            })

        }
    },
    /**
     * `StudentController.delete()`
     */
    delete: function (req, res) {

        if (req.method != "POST") {

            client.get(endpoint, function (data, response) {
                // sort the students returned so they are in order in dropdown on page 
                data.sort(SortByName);
                return res.view('delete', {
                    students: data
                });
            }).on('error', function (err) {
                return res.view('delete', {
                    error: {
                        message: "There was an error getting the students"
                    }
                });
            });

        } else {

            client.delete(endpoint + "/" + req.body.student_id, function (data, response) {

                if (response.statusCode != "200") {
                    req.addFlash("error", data.message);
                    return res.redirect('/delete');
                }

                req.addFlash("success", "Record deleted successfully");
                return res.redirect('/delete');

            })
        }

    }

};
