// ==UserScript==
// @name         Youtube Speed By Channel
// @namespace    Alpe
// @version      0.2.4
// @description  Allow to choose the default speed for specific YT channel
// @author       Alpe
// @include      https://www.youtube.com/*
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.deleteValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @require      https://code.jquery.com/jquery-3.5.1.min.js
// ==/UserScript==

(async () => {
    const defaults = {
        DEFAULT_SPEED: 1.0,
        SHOW_RELATIVE_TIME: true,
        COLOR_SELECTED: "red",
        COLOR_NORMAL: "rgb(220,220,220)",
        BUTTON_TEMPLATES: JSON.stringify([
            ["50%", 0.5],
            ["75%", 0.75],
            ["Normal", 1],
            ["1.25x", 1.25],
            ["1.5x", 1.5],
            ["1.75x", 1.75],
            ["2x", 2],
            ["2.25x", 2.25],
            ["2.5x", 2.5],
            ["3x", 3],
            ["3.5x", 3.5]
        ])
    }

    for (let name in defaults) {
        let value = defaults[name];
        window[name] = (name === "BUTTON_TEMPLATES" ? JSON.parse(await GM.getValue("_YSC-" + name,value)) : await GM.getValue("_YSC-" + name,value));
    }

    async function toggleconfig(name,e){
        e = e||!(await GM.getValue("_YSC-" + name,defaults[name]));
        GM.setValue("_YSC-" + name,e);
        alert(name + ': ' + e);
    }

    if (typeof GM_registerMenuCommand == 'undefined') {
        this.GM_registerMenuCommand = (caption, commandFunc, accessKey) => {
            if (!document.body) {
                if (document.readyState === 'loading'
                    && document.documentElement && document.documentElement.localName === 'html') {
                    new MutationObserver((mutations, observer) => {
                        if (document.body) {
                            observer.disconnect();
                            GM_registerMenuCommand(caption, commandFunc, accessKey);
                        }
                    }).observe(document.documentElement, {childList: true});
                } else {
                    console.error('GM_registerMenuCommand got no body.');
                }
                return;
            }
            let contextMenu = document.body.getAttribute('contextmenu');
            let menu = (contextMenu ? document.querySelector('menu#' + contextMenu) : null);
            if (!menu) {
                menu = document.createElement('menu');
                menu.setAttribute('id', 'gm-registered-menu');
                menu.setAttribute('type', 'context');
                document.body.appendChild(menu);
                document.body.setAttribute('contextmenu', 'gm-registered-menu');
            }
            let menuItem = document.createElement('menuitem');
            menuItem.textContent = caption;
            menuItem.addEventListener('click', commandFunc, true);
            menu.appendChild(menuItem);
        };
    }


    $.each([
        ["List current settings", async function(){
            var set = [];
            for (let name in defaults) {
                let value = defaults[name];
                set.push(name + ' = ' + await GM.getValue('_YSC-' + name,value) + (( await GM.getValue('_YSC-' + name,value)!=defaults[name])?" [default is " + defaults[name] + "]":""));
            }
            alert(set.join('\n'));
        }],
        ["Configure default speed", async function(){
            var temp = prompt("Default: " + defaults['DEFAULT_SPEED'], await GM.getValue('_YSC-DEFAULT_SPEED',DEFAULT_SPEED));
            if (temp === null) return;
            if (temp.length === 0){
                GM.deleteValue('_YSC-DEFAULT_SPEED');
                alert("default restored");
                return;
            }
            temp = parseFloat(temp);
            if (!isNaN(temp)) toggleconfig('DEFAULT_SPEED',temp);
        }],
        ["Show time relative to speed", async function(){
            var temp = prompt("Default: " + defaults['SHOW_RELATIVE_TIME'], await GM.getValue('_YSC-SHOW_RELATIVE_TIME',SHOW_RELATIVE_TIME));
            if (temp === null) return;
            if (temp.length === 0){
                GM.deleteValue('_YSC-SHOW_RELATIVE_TIME');
                alert("default restored");
                return;
            }
            if (temp === "true" || temp === "false") toggleconfig('SHOW_RELATIVE_TIME', (temp === "true"));
        }],
        ["Configure Color for the selected speed", async function(){
            var temp = prompt("Default: " + defaults['COLOR_SELECTED'], await GM.getValue('_YSC-COLOR_SELECTED',COLOR_SELECTED));
            if (temp === null) return;
            if (temp.length === 0){
                GM.deleteValue('_YSC-COLOR_SELECTED');
                alert("default restored");
                return;
            }
            toggleconfig('COLOR_SELECTED',temp);
        }],
        ["Configure color for unselected speed", async function(){
            var temp = prompt("Default: " + defaults['COLOR_NORMAL'], await GM.getValue('_YSC-COLOR_NORMAL',COLOR_NORMAL));
            if (temp === null) return;
            if (temp.length === 0){
                GM.deleteValue('_YSC-COLOR_NORMAL');
                alert("default restored");
                return;
            }
            toggleconfig('COLOR_NORMAL',temp);
        }],
        ["Configure Buttons", async function(){
            var temp = prompt("What buttons should be displayed.\nformat: [text,speed]\neg: [half,0.5][normal,1][double,2]", '[' + JSON.parse(await GM.getValue('_YSC-BUTTON_TEMPLATES',JSON.stringify(BUTTON_TEMPLATES))).join('],[') + ']');
            if (temp === null) return;
            if (temp.length === 0){
                GM.deleteValue('_YSC-BUTTON_TEMPLATES');
                alert("default restored");
                return;
            }
            var match = temp.match(/\[[^,]+,[^\]]+\]/g);
            if (!match){
                alert("invalid option");
            } else {
                var array = [];
                for (let i=0; i < match.length; i++){
                    let match2 = match[i].match(/\[([^,]+),([^\]]+)/);
                    array.push([match2[1], parseFloat(match2[2])])
                }
                toggleconfig('BUTTON_TEMPLATES',JSON.stringify(array));
            }
        }],
        ["Restore default",function(){
            for (let name in defaults) {
                GM.deleteValue('_YSC-' + name);
            }
            alert("Default restored");
        }]
    ], function(a,b){ GM_registerMenuCommand(b[0],b[1]); });

    var stateKey, eventKey;
    {
        let keys = {
            hidden: "visibilitychange",
            webkitHidden: "webkitvisibilitychange",
            mozHidden: "mozvisibilitychange",
            msHidden: "msvisibilitychange"
        }
        for (stateKey in keys) {
            if (stateKey in document) {
                eventKey = keys[stateKey];
                break;
            }
        }
    }

    function vis (c) {
        if (c) document.addEventListener(eventKey, c);
        return !document[stateKey];
    }

    function getspeed(params = {}){
        let speed, reason;
        if (params.hasOwnProperty('force1x') && params.force1x){
            speed = 1;
            reason = "forcing 1x (live?)";
        } else if (params.hasOwnProperty('channelspeed') && typeof params.channelspeed === "number"){
            speed = params.channelspeed;
            reason = "channelspeed";
        } else if (params.hasOwnProperty('defspeed') && Number.isInteger(params.defspeed)){
            speed = params.defspeed;
            reason = "overwritten default (music?)";
        } else {
            speed = DEFAULT_SPEED;
            reason = "default";
        }
        if (params.channelspeed === undefined) delete params.channelspeed;
        if (params.defspeed === null) delete params.defspeed;
        if (params.force1x === false) delete params.force1x;
        params['chosenspeed'] = speed;
        params['chosenreason'] = reason;
        console.log(params);
        return speed;
    }

    function buttonclick(el){
        let id = el.target.parentNode.id.match(/\d+$/)[0];
        el = $(el.target);
        el.parent().children(":not([title])").css("color", COLOR_NORMAL);
        el.css("color", COLOR_SELECTED);
        if ($('video[vsb-video="' + id + '"]').length === 0){
            youtubefix();
        }
        let video = $('video[vsb-video=' + id + ']')[0];
        video.playbackRate = parseFloat(el.attr('speed'));
        if (SHOW_RELATIVE_TIME) changetime(video);
    }

    function setchanneldefault(el){
        let id = el.target.parentNode.id.match(/\d+$/)[0];
        let channel = $('#channel-name[vsb-channel=' + id + ']').find('#container #text').text().trim();
        changebuttontitle(id, channel);
        let currentspeed = $('video[vsb-video=' + id + ']')[0].playbackRate;
        el = $(el.target).parent();
        el.children().css("text-decoration", "").filter('span[speed="' + currentspeed + '"]').css("text-decoration", "underline");
        GM.setValue(channel, currentspeed);
        console.log('changing default for (' + channel + ') to (' + currentspeed + ')');
    }

    function createcontainer(curspeed, id){
        let div = document.createElement("div");
        let prev_node = null;

        div.id = "vsb-container" + id;
        div.style.marginBottom = "0px";
        div.style.paddingBottom = "0px";
        div.style.float = "left";

        div.innerHTML += '<span style="margin-right: 10px; font-weight: bold; font-size: 80%; color: white; cursor: pointer;" title="Set current speed as default for this channel">setdefault</span>';
        BUTTON_TEMPLATES.forEach(function(button){
            div.innerHTML += '<span style="margin-right: 10px; font-weight: bold; font-size: 80%; color: ' + (curspeed === button[1] ? COLOR_SELECTED : COLOR_NORMAL) + '; cursor: pointer;" speed="' + button[1] + '">' + button[0] + '</span>';
        });

        $('span:not([title])', div).on( "click", buttonclick);
        $('span[title]', div).on( "click", setchanneldefault);

        return div;
    }

    window.vsbid = 0;

    function getid(){
        let id = window.vsbid;
        window.vsbid++;
        return id;
    }

    function changebuttontitle(id, channelname = ''){
        let container = $('#vsb-container' + id + ' > span[title]');
        if (container.length > 0){
            container[0].title = container[0].title.split(' [')[0] + (channelname !== '' ? ' [' + channelname + ']' : '');
        }
    }

    function ob_youtube_movieplayer (mutationsList, observer){
        for(let mutation of mutationsList) {
            if (mutation.attributeName === 'video-id'){
                let el = $('[id^=vsb-container]', mutation.target);
                let id = el[0].id.match(/\d+$/)[0];
                let channeldiv = $('#channel-name[vsb-channel="' + id + '"]');
                if($('span[speed="1"]', el).click().length === 0) $('video[vsb-video="' + id + '"]')[0].playbackRate = 1;
                $('span', el).css("text-decoration", "");
                changebuttontitle(id);
                setTimeout(async function(){
                    let channelspeed, channelname = channeldiv.find('#container #text').text().trim();
                    let tries = 1;
                    while(channelname === '' && tries <= 8){
                        if (tries === 1){
                            alert('sleeping');
                            console.log("id", id);
                            console.log("channeldiv", channeldiv);
                            console.log("channelname", channelname);
                        }
                        console.log('sleeping ' + tries, channeldiv);
                        await (new Promise(resolve => setTimeout(resolve, 200)));
                        channelname = channeldiv.find('#container #text').text().trim();
                        tries++;
                    }
                    if (channelname !== ''){
                        channelspeed = await GM.getValue(channelname);
                        console.log(channelname, channelspeed);
                    } else {
                        channelspeed = undefined;
                    }
                    changebuttontitle(id, channelname);
                    $('span[speed="' + channelspeed + '"]', el).css("text-decoration", "underline");
                    let speed = getspeed({
                        channelspeed: channelspeed,
                        defspeed: (channeldiv.find('.badge-style-type-verified-artist').length === 1 || channelname.match(/VEVO$/) ? 1 : null),
                        force1x: (el.closest('#movie_player').find('.ytp-live').length === 1)
                    });
                    if($('span[speed="' + speed + '"]', el).click().length === 0) $('video[vsb-video="' + id + '"]')[0].playbackRate = speed;
                },500);
            }
        }
    }

    function ob_youtube_c4player (mutationsList, observer){
        for(let mutation of mutationsList) {
            if (mutation.attributeName === 'src' && mutation.target.src !== ''){
                let id = mutation.target.getAttribute("vsb-video");
                let channeldiv = $('#channel-name[vsb-channel="' + id + '"]');
                $('video[vsb-video="' + id + '"]')[0].playbackRate = 1;
                setTimeout(async function(){
                    $('video[vsb-video="' + id + '"]')[0].playbackRate = getspeed({
                        channelspeed: await GM.getValue(channeldiv.find('#container #text').text().trim()),
                        defspeed: (channeldiv.find('.badge-style-type-verified-artist').length === 1 ? 1 : null)
                    });
                },1000);
            }
        }
    }

    function youtubefix(){
        $('#movie_player[monitored], #c4-player[monitored]').each(
            function(){
                let video = $('video', this);
                if (video.attr('vsb-video') === undefined){
                    let el = $(this);
                    let id = el.attr('monitored');
                    console.log('fixing', video);
                    setTimeout(function(){
                        video.attr('vsb-video', id);
                        $('span:not([title]):visible', '#vsb-container' + id).filter(function() {
                            return ( this.style.color == COLOR_SELECTED );
                        }).click();
                    },750);
                }
            }
        );
    }

    function fancyTimeFormat(duration){
        var hrs = ~~(duration / 3600);
        var mins = ~~((duration % 3600) / 60);
        var secs = ~~duration % 60;

        var ret = "";

        if (hrs > 0) {
            ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
        }

        ret += "" + mins + ":" + (secs < 10 ? "0" : "");
        ret += "" + secs;
        return ret;
    }

    function changetime (event){
        let video = (typeof event["target"] === "object" ? event.target : event);
        let id = video.getAttribute('vsb-video');
        let timediv = $('#movie_player[monitored="' + id + '"]:visible .ytp-time-display:visible');
        if (timediv.length === 0) return;
        let reltimespan = timediv[0].getElementsByClassName('vsb-reltime');
        if (reltimespan.length === 0){
            timediv[0].insertAdjacentHTML('beforeend', '<span class="vsb-reltime"></span>');
            reltimespan = timediv[0].getElementsByClassName('vsb-reltime');
        }
        reltimespan[0].innerHTML = (video.playbackRate === 1 || isNaN(video.duration) ? '' : '<span> (</span>' + fancyTimeFormat(video.currentTime / video.playbackRate) + ' / ' + fancyTimeFormat(video.duration / video.playbackRate) + '<span>)</span>');
    }

    function youtube(){
        $('#movie_player:visible:not([monitored]), #c4-player:visible:not([monitored])').each(async function( index ) {
            let el = $(this);
            let speed, channelspeed;
            if (this.id === "movie_player"){
                let channeldiv = el.closest('ytd-watch-flexy').find('#upload-info #channel-name');
                if (!channeldiv.length) return;
                let channelname = channeldiv.find('#container #text').text().trim();
                if (channelname === '') return;
                let appendto = el.find("div.ytp-right-controls");
                if (!appendto.length) return;
                let videodiv = el.find('video')
                if (!videodiv.length) return;

                let id = getid();
                el.attr('monitored', id);
                channeldiv.attr('vsb-channel', id);
                videodiv.attr('vsb-video', id);

                $('#ytp-id-20 .ytp-menuitem-label:contains(Playback speed)', el).parent().css('display', 'none');

                console.log("Adding video-id observer");
                (new MutationObserver(ob_youtube_movieplayer)).observe(el.closest('ytd-watch-flexy')[0], { attributes: true });

                (new MutationObserver(function(mutationsList, observer){
                    for(let mutation of mutationsList) {
                        if (mutation.attributeName === 'src') console.log('mutation', mutation.target.src);
                        if (mutation.attributeName === 'src' && mutation.target.src === '') youtubefix();
                    }
                })).observe(el.find('video')[0], { attributes: true });

                channelspeed = await GM.getValue(channelname);
                speed = getspeed({
                    channelspeed: channelspeed,
                    defspeed: (channeldiv.find('.badge-style-type-verified-artist').length === 1 || channelname.match(/VEVO$/) ? 1 : null),
                    force1x: (el.find('.ytp-live').length === 1)
                });
                let div = createcontainer(speed, id);
                $('span[speed="' + channelspeed + '"]', div).css("text-decoration", "underline");
                appendto.append(div);
                changebuttontitle(id, channelname);
                videodiv[0].playbackRate = speed;
                if (SHOW_RELATIVE_TIME) videodiv[0].addEventListener("timeupdate", changetime,false);
            } else if (this.id === "c4-player"){
                let channeldiv = el.closest('ytd-browse').find('#header #channel-name');
                if (!channeldiv.length) return;
                let channelname = channeldiv.find('#container #text').text().trim();
                if (channelname === '') return;
                let videodiv = el.find('video')
                if (!videodiv.length) return;

                el.attr('monitored', id);
                let id = getid();
                channeldiv.attr('vsb-channel', id);
                videodiv.attr('vsb-video', id);

                console.log("Adding c4 observer");
                (new MutationObserver(ob_youtube_c4player)).observe(el.find('video')[0], { attributes: true, subtree: true });

                videodiv[0].playbackRate = getspeed({
                    channelspeed: await GM.getValue(channelname),
                    defspeed: (channeldiv.find('.badge-style-type-verified-artist').length === 1 ? 1 : null)
                });
            }
        });
    }

    function mark_loop(){
        if (location.host.endsWith('youtube.com')){
            youtube();
            if (window.vsbid < 2){
                setTimeout(mark_loop, ((window.vsbid === 0 ? 500 : 2500) * (vis() ? 1 : 2)));
            } else {
                console.log('stopping loop');
            }
        } else {
            setTimeout(mark_loop, 1500 * (vis() ? 1 : 4));
        }
    }
    window.addEventListener('load', mark_loop);
})();

