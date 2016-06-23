$(document).ready(function () {
    Snapster = localStorage['Snapster'];
    userID = localStorage['userID'];
    $.ajax({
        type: "GET",
        url: "https://api.spotify.com/v1/users/" + userID + "/playlists/" + Snapster + "/tracks",
        headers: { 'Authorization': 'Bearer ' + access_token },
        dataType: "json",
        data: "formdata",
        success: function (currentPLData) {
            for (i = 0; i < currentPLData.items.length; i++) {
                $(".songLinkCurrent").eq(i).on("click", function () {
                    $(".songLinkCurrent").eq(i).attr("alt", "1");
                });
            }
        }
    });
});