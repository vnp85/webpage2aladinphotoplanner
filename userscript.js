// ==UserScript==
// @name             astro-webpage  to aladinPhotoPlanner
// @namespace        http://tampermonkey.net/
// @version          0.1
// @description      make the mentioned deep sky objects link to aladin2photoPlanner
// @author           VARADI NAGY Pal
// @author_webpage   csillagtura.ro
// @match            *://*/*
// @grant            none
// ==/UserScript==

(function() {
    'use strict';

    var dontRunIfURLContains = [
        "csillagtura.ro",
        "google.com",
        "aladin"
    ];

    var runIfURLContains = [
        "tavcso.hu",
        "asztrofoto.hu",
        "facebook.com",
        "csillagaszat.hu"
    ];

    var tagsToCheck = [
      "p", "span", "div",
      "h1", "h2", "h3",
      "h4", "h5"
    ];

    var catalogs = [
        "NGC", "IC", "M", "C", "Messier",

        "PGC", "UGC", "LDN", "LBN",

        "Caldwell", "Melotte", "Simeis",

        "Collinder", "Cr", "Col",

        "SH2", "SH2-",
        "Sharpless2-",
        "Sharpless 2-", "Sharpless2- ",
        "Sharpless 2-", "Sharpless 2- ",

        "VDB", "VdB"
    ];

    function getURL(cat, num){
        return 'https://csillagtura.ro/aladin/#'+cat+num;
    }

    function isTheNodeAChildOfAForbiddenElement(n){
        var c = n;
        while (c){
            if (!c.tagName){
                return false;
            }
            if (c.tagName.toLowerCase() == "a"){
                // already in a link, leave
                return true;
            }
            if (c.tagName.toLowerCase() == "svg"){
                // we should not interefere here
                return true;
            }
            c = c.parentNode;
        }
        return false;
    }
    function theAladinExtension_processElement(e){
        var att = 'data-aladin-extension-element-has-been-processed';
        if (e.getAttribute(att) == 1){
            return ;
        }
        e.setAttribute(att, 1);
        if (isTheNodeAChildOfAForbiddenElement(e)){
            return ;
        }
        var s2 = e.innerHTML;
        if (s2.length > 500){
            // this node is too long
            return ;
        }
        if (s2.toLowerCase().indexOf(String.fromCharCode(60)+'div') > -1){
            // has embedded divs, leave the node alone
            return ;
        }
        if (s2.toLowerCase().indexOf(String.fromCharCode(60)+'a ') > -1){
            // has embedded anchors, leave them
            return ;
        }
        if (s2.toLowerCase().indexOf(String.fromCharCode(60)+'svg') > -1){
            //should leave nodes with SVGs in them alone
            return ;
        }

        var s = " " + s2 + " ";
        catalogs.forEach(function (k){
            for (j=0; j<10; j++){
                s = s.split(" "+k+j).join(' '+k+' '+j);
                s = s.split("("+k+j).join('('+k+' '+j);
            }
        });
        var lnbr = " %linebreak%";
        s = s.split(String.fromCharCode(60)+'br'+String.fromCharCode(62)).join(lnbr);
        s = s.split(String.fromCharCode(60)+'br '+String.fromCharCode(62)).join(lnbr);
        s = s.split(String.fromCharCode(60)+'br/'+String.fromCharCode(62)).join(lnbr);
        s = s.split(String.fromCharCode(60)+'br /'+String.fromCharCode(62)).join(lnbr);

        s = s.split("  ").join(" ").split(" ");

        for (var i=0; i<s.length; i++){
            for (var j = 0; j<catalogs.length; j++){
               if (s[i].toUpperCase().replace("(", "") == catalogs[j].toUpperCase()){
                   var w = s[i+1].toLowerCase()
                       .replace("a", "")
                       .replace("b", "")
                       .replace("c", "")
                       .replace(",", "")
                       .replace(")", "")
                       .replace(String.fromCharCode(13), "")
                       .replace(String.fromCharCode(10), "")
                       .replace(String.fromCharCode(60), "")
                   ;
                   var n = w*1;
                   if (n === n){
                       // n is a number, see Erdos Pal
                       var lead = '<a title="seen on aladin2photoplanner" href="'+getURL(catalogs[j], n)+'" target="_blank">';
                       var tail = '</a>';
                       s[i] = lead+s[i];
                       s[i] = s[i].replace(lead+'(', '('+lead);
                       s[i+1] = (s[i+1]+tail);
                       [
                           ")", "-", ']',
                           String.fromCharCode(60), String.fromCharCode(62),
                           String.fromCharCode(9), String.fromCharCode(13), String.fromCharCode(10),
                           ','
                       ].forEach(function (placeItOutside){
                         s[i+1] = s[i+1].replace(placeItOutside+tail, tail+placeItOutside);
                       });
                   }
               }
            }
        }
        s = s.join(" ").trim();
        var br = String.fromCharCode(60)+'br'+String.fromCharCode(62);
        s = s.split(lnbr.trim()).join(br).split(' '+br).join(br);
        if (s != s2){
            e.innerHTML = s;
        }
    };
    function theAladinExtension(){
        var ps, l, i;
        tagsToCheck.forEach(function (tagName){
            ps = document.getElementsByTagName(tagName);
            l = ps.length;
            for (i=0; i<l; i++){
                theAladinExtension_processElement(ps[i]);
            }
        });
        //facebook has this
        ps = document.getElementsByClassName("text_exposed_root");
        l = ps.length;
        for (i=0; i<l; i++){
            theAladinExtension_processElement(ps[i]);
        }
    };

    var allowed = false;
    console.log(document.URL);
    runIfURLContains.forEach(function (u){
      if (document.URL.indexOf(u) > -1){
          allowed = true;
      }
    });
    dontRunIfURLContains.forEach(function (u){
      if (document.URL.indexOf(u) > -1){
          allowed = false;
      }

    });
    if (allowed){
        // facebook does weird, very weird things
        //   to intervals and timeouts,
        //   so this won't keep running in facebook
        // I have figured out a way to circumvent it,
        //   but sorry, not publishing it
        setInterval(theAladinExtension, 1000);
    }
    // we may need a globally accessible function
    window.funcTheAladinExtension = theAladinExtension;
})();
