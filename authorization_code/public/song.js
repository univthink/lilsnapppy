$(document).ready(function () {
    var userID;
    var baseURL;
    var myData;
    var searchQry;
    var trackID;
    var sendInfo;
    var Snapster;
    var playlists = [];
    var total;
    var totalVariable;
    var urlData;
    var jsonData;
    var obj;
    var userLink;
    var userData;
    var jData;
    var partyPlaylist;
    $(window).load(function () {
      userID = $('#userID2').html();
      $.ajax({
          type: "GET",
          url: "https://api.spotify.com/v1/me/",
          headers: { 'Authorization': 'Bearer ' + access_token },
          dataType: "json",
          data: "formdata",
          success: function (userData) {userLink = "https://lilsnapppy.herokuapp.com/#access_token=" + access_token;}
        });
        baseURL = "https://api.spotify.com/v1/users/";
        searchQry = document.getElementById('filename').value;
        $.ajax({
            type: "GET",
            url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
            headers: { 'Authorization': 'Bearer ' + access_token },
            dataType: "json",
            data: "formdata",
            success: function (data) {
                for (i = 0; i < data.items.length; i++) {
                    playlists.push(data.items[i].name);
                }
                partyPlaylist = playlists.indexOf("Partify");
                console.log(partyPlaylist);
                if (playlists.indexOf("Partify") == -1) {
                    sendInfo = { "name": "Partify", "public": true, }
                    $.ajax({
                        type: "POST",
                        url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
                        headers: { 'Authorization': 'Bearer ' + access_token },
                        dataType: "application/json",
                        data: JSON.stringify(sendInfo),
                        success: function (dataFirst) {
                            $.ajax({
                                type: "GET",
                                url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
                                headers: { 'Authorization': 'Bearer ' + access_token },
                                dataType: "json",
                                data: "formdata",
                                success: function (data) {
                                    Snapster = data.items[i].id;
                                    $("#results").hide().fadeIn('fast');
                                    location.reload();
                                }
                            });
                        }
                    });
                }
            }
        });
        userID = $('#userID2').html();
    $("#filename").keypress(function (event) {
            if (event.which == 13) {
                $("#results").empty();
          //  $("#searchSongs").click(function () {
                    baseURL = "https://api.spotify.com/v1/users/";
                    searchQry = document.getElementById('filename').value;
                    userID = $('#userID2').html();
                $.ajax({
                    type: "GET",
                    url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    dataType: "json",
                    data: "formdata",
                    success: function (data) {
                        for (i = 0; i < data.items.length; i++) {
                            playlists.push(data.items[i].name);
                        }
                        partyPlaylist = playlists.indexOf("Partify");
                        console.log(partyPlaylist);
                        if (playlists.indexOf("Partify") == -1) {
                            sendInfo = { "name": "Partify", "public": true, }
                            $.ajax({
                                type: "POST",
                                url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
                                headers: { 'Authorization': 'Bearer ' + access_token },
                                dataType: "application/json",
                                data: JSON.stringify(sendInfo),
                                success: function (dataFirst) {
                                    $.ajax({
                                        type: "GET",
                                        url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
                                        headers: { 'Authorization': 'Bearer ' + access_token },
                                        dataType: "json",
                                        data: "formdata",
                                        success: function (data) {
                                            Snapster = data.items[i].id;
                                            $("#results").hide().fadeIn('fast');
                                        }
                                    });
                                    $.ajax({
                                        type: "GET",
                                        url: "https://api.spotify.com/v1/search?q=" + searchQry + "&type=track,artist&market=us&limit=50&offset=0",
                                        headers: { 'Authorization': 'Bearer ' + access_token },
                                        dataType: "json",
                                        data: "formdata",
                                        success: function (myData) {
                                            for (i = 0; i < myData.tracks.length; i++) {
                                                $('#results').append("<header style='float: left;' 'class='songLink'>" + myData.tracks.items[i].artists[0].name + "<br />" + myData.tracks.items[i].name + "<img style='float: right;' src='plus.png;'></header><br/>");
                                                $(".songLink").eq(i).attr("id", "songLink" + i);
                                                $(".songLink").eq(i).attr("name", baseURL + userID + "/playlists/" + Snapster + "/tracks?&uris=spotify%3Atrack%3A" + myData.tracks.items[i].id);
                                                $('#songLink' + i).on("click", function () {
                                                    //for (i = 0; i < data.items.length; i++) {
                                                    //    $('#songLink' + i).on("click", function () {
                                                    $.ajax({
                                                        type: "POST",
                                                        url: $(this).attr('name'),
                                                        headers: { 'Authorization': 'Bearer ' + access_token },
                                                        dataType: "json",
                                                        data: "formdata",
                                                        success: function (dataFirst) {
                                                        console.log(Snapster);
                                                        $("#results").empty();
                                                        $("#results").css("text-align", "center");
                                                        $("#results").append($('<img />').attr({ display: "block", src: "check-mark.png", top: "25%" }));
                                                        setTimeout(function () {
                                                            location.reload();
                                                        }, 1000);
                                                        }
                                                    });
                                                });
                                            }
                                        }


                                    });
                                }
                            });



                        }
                        else if (playlists.indexOf("Partify") != -1) {
                            console.log(partyPlaylist + "Already Exists");
                            Snapster = data.items[partyPlaylist].id;
                            $("#results").hide().fadeIn('fast');
                            $.ajax({
                                type: "GET",
                                url: "https://api.spotify.com/v1/search?q=" + searchQry + "&type=track,artist&market=us&limit=50&offset=0",
                                headers: { 'Authorization': 'Bearer ' + access_token },
                                dataType: "json",
                                data: "formdata",
                                success: function (myData) {
                                    $.ajax({
                                        type: "GET",
                                        url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
                                        headers: { 'Authorization': 'Bearer ' + access_token },
                                        dataType: "json",
                                        data: "formdata",
                                        success: function (data) {
                                            for (i = 0; i < data.items.length; i++) {
                                                playlists.push(data.items[i].name);
                                            }
                                            if (playlists.indexOf("Partify") != -1) {
                                                for (i = 0; i < data.items.length; i++) {
                                                    console.log("Already Exists");
                                                    Snapster = data.items[partyPlaylist].id;
                                                }
                                                for (i = 0; i < myData.tracks.items.length; i++) {
                                                    $('#results').append("<header class='songLink'>" + myData.tracks.items[i].artists[0].name + "<br />" + myData.tracks.items[i].name + "</header><br/>");
                                                    $(".songLink").eq(i).attr("id", "songLink" + i);
                                                    $(".songLink").eq(i).attr("name", baseURL + userID + "/playlists/" + Snapster + "/tracks?&uris=spotify%3Atrack%3A" + myData.tracks.items[i].id);
                                                    $('header#songLink' + i).on("click", function () {
                                                    $.ajax( {
                                                        type: "POST",
                                                        url: $(this).attr('name'),
                                                        headers: { 'Authorization': 'Bearer ' + access_token },
                                                        dataType: "json",
                                                        data: "formdata",
                                                        success: function (dataFirst) {
                                                            console.log("playlist id=" + Snapster);
                                                            console.log("song id=" + myData.tracks.items.id);
                                                            $("#results").empty();
                                                            $("#results").css("text-align", "center");
                                                            $("#results").append($('<img />').attr({ display: "block", src: "check-mark.png", top: "25%" }));
                                                            setTimeout(function () {
                                                                location.reload();
                                                            }, 1000);
                                                            }
                                                        });
                                                    });
                                                }
                                            }
                                        }
                                    });
                                }
                            });

                        }
                    }
                });

         //   });

        }
    });
    });
});
