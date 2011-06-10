(function($){
  wysiwyg.packages["basic"]={
    namespace:"basic",
    controls:["bold","italic","underline","subscript","superscript","createLink","unlink","html","undo","redo","horizontalrule","fullscreen"],
    checkForAnchor:true,
    _init:function(controls,ed){
      var iconbase="../plugins/basic/images/";
      var cntrl,cntrlNm=null,toolUL = $("<ul/>").addClass("package-"+this.namespace);

      if(controls.length<1) {
        return false;
      }

      if(controls==="*"){
        controls = this.controls;
      }

      for(var c=0;c<controls.length;c++){
        cntrl = null;
        cntrlNm = controls[c];
        switch (cntrlNm) {
          case "bold":
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-30px 0px"
                                         },ed);
            break;
          case "italic":
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-45px 0px"
                                         },ed);
            break;
          case "underline":
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-60px 0px"
                                         },ed);
            break;
          case "subscript":
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-15px 0px"
                                         },ed);
            break;
          case "superscript":
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:0px 0px"
                                         },ed);
            break;
          case "undo" :
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-93px 0",
                                         func:this._undo
                                         },ed);
            break;
          case "redo" :
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-77px 0",
                                         func:this._redo
                                         },ed);
            break;
          case "fullscreen" :
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-169px 0",
                                         func:this.fullScreen,
                                         tip:"View Fullscreen"
                                        },ed);

            $(window).bind("scroll.cmwysi",this._scrolling);
            $(window).bind("resize.cmwysi",this._resizing);
            break;
          case "unlink" :
            cntrl=wysiwyg.Controls.createButton(cntrlNm,{
                                       "icon":"",
                                       "class":"sprite",
                                       "css":"background-position:-150px 0",
                                       func:this.removeAnchor},ed);
            break;
          case "horizontalrule" :
            cntrl = wysiwyg.Controls.createButton("inserthorizontalrule", {
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-187px 0",
                                         tip:"Insert Horizontal Rule"},ed);
            break;
          case "createLink" :
            cntrl = wysiwyg.Controls.createDialog(cntrlNm,
                                    {"icon":iconbase+cntrlNm+".png",
                                     width:"200",
                                     height:"160",
                                     title:"Add a link",
                                     bgPos:"-111px 0px",
                                     message:{
                                      html:"<div class='row'>Text: <input type='text' name='text' value='' /></div>"+
                                           "<div class='row'>Link: <input type='text' name='link' value='' /></div>" },
                                      callback:"wysiwyg.packages.basic.insertLink",
                                      dynamicContent:"wysiwyg.packages.basic.dynamicContent"
                                     },ed);

            $.extend(wysiwyg.context.definitions["*"], {"Create/Edit Link":{name:"create",cmd:"$(wysiwyg.active.element).prev().find(\".toolbar .createLink\").click();"}});
            break;
          case "html" :
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-204px 0",
                                         tip:"View Code",
                                         func:this.showSource},ed);
            break;
          default:
            break;
        }
        if (cntrl!=null) {
          $(toolUL).append(cntrl)
        }
      }
      wysiwyg.ToolbarManager.AddList(ed,toolUL);
    },
    _nodechange : function(j,src,ev) {
      if ( src.nodeName.toLowerCase() === "a") {
        $(wysiwyg.active.toolbar.element)
          .find(".createLink")
          .addClass("sprite")
          .css("background-position","-131px 0");
      } else {
        $(wysiwyg.active.toolbar.element)
          .find(".createLink")
          .addClass("sprite")
          .css("background-position","-111px 0px");
      }

      if($(src).css("font-weight")=="bold"){
        $(j.toolbar.element).find(".bold").parent().addClass("active");
      } else {  $(j.toolbar.element).find(".bold").parent().removeClass("active"); }
      if($(src).css("font-style")=="italic"){
        $(j.toolbar.element).find(".italic").parent().addClass("active");
      } else {  $(j.toolbar.element).find(".italic").parent().removeClass("active"); }
      if(src.style.textDecoration=="underline"){
        $(j.toolbar.element).find(".underline").parent().addClass("active");
      } else {  $(j.toolbar.element).find(".underline").parent().removeClass("active"); }
      if($(src).is("sup")||$(src).parent("sup").length>0){
        $(j.toolbar.element).find(".superscript").parent().addClass("active");
      } else { $(j.toolbar.element).find(".superscript").parent().removeClass("active"); }
      if($(src).is("sub")||$(src).parent("sub").length>0){
        $(j.toolbar.element).find(".subscript").parent().addClass("active");
      } else { $(j.toolbar.element).find(".subscript").parent().removeClass("active"); }
      return true;
    },
    _italic:function(t) {
      t.ActionManager.snap(t);
      if(t.selection.node.nodeName.toLowerCase()=="body"&&t.selection.type==="#text") {
        wysiwyg.selection.replaceSelection("<span style='font-style:italic;'>"+t.selection.text+"</span>",t);
      } else {
        $(t.selection.node).css("font-style","italic");
      }
    },
    _bold:function(t) {
      t.ActionManager.snap(t);
      if(t.selection.node.nodeName.toLowerCase()=="body"&&t.selection.type==="#text") {
        wysiwyg.selection.replaceSelection("<span style='font-weight:bold;'>"+t.selection.text+"</span>",t);
      } else {
        $(t.selection.node).css("font-weight","bold");
      }
    },
    removeAnchor : function() {
      var t = wysiwyg.active;
      if( (! t.selection.fullNode()) && (t.selection.parent.nodeName.toLowerCase() == "a") ) {
        t.selection.selectFull();
      }
      t.wysiDoc.execCommand("unlink",false, {});
    },
    fullScreen : function(ed) {
      var w=wysiwyg;
      var t=w.editors[ed.element.id];
      var toolbar = $(t.iframe).prev();
      var statusbar = $(t.iframe).next();

      if(ed.element.id!="fullscreen"){
        var fullscreenEd = $("<textarea/>");
        $(fullscreenEd).attr("display","none").attr("id","fullscreen");
        $("body").append(fullscreenEd);
        var fullEd=w.API.create("fullscreen",fullscreenEd,$.extend(t.opts,{resizable:"false"}));

        $(fullEd.iframe)
          .parent()
          .css({
            width:"100%",
            height:$(window).height(),
            position:"absolute",
            left:0,
            top:$(top.window).scrollTop(),
            "z-index":"10000",
            margin:"0px"
          })
          .end()
          .css({width:"100%"});//,height:iframeht,top:0,left:0}).parent().css({"position":"absolute",width:$(top.window).width(),top:$(top.window).scrollTop(),left:0,"z-index":"10000",margin:"0px"});

        var iframeht;
        if ($(fullEd.iframe).parent().height()>$(window).height()) {
          iframeht=$(window).height()-$(fullEd.toolbar.element).height()-$(statusbar).height();
        } else {
          iframeht=$(fullEd.iframe).parent().height()-$(fullEd.toolbar.element).height()-$(statusbar).height();
        }

        $(fullEd.iframe).css({height:iframeht})

        $(fullEd.wysiDoc)
          .find("body")
          .html($(t.wysiDoc).find("body").html());

        if(typeof wysiwyg.fullscreen=="undefined"){
          wysiwyg["fullscreen"]={};
        }

        wysiwyg.fullscreen["using"]=ed.element.id;
        $(fullscreenEd).show();
      } else {
        $(wysiwyg.editors[wysiwyg["fullscreen"]["using"]].wysiDoc).find("body").html($(wysiwyg.editors["fullscreen"].wysiDoc).find("body").html());
        wysiwyg.API.remove("fullscreen");
        wysiwyg.API.update(w.fullscreen.using);
      }
    },
    _undo:function(t){
      t.ActionManager.undo(t);
    },
    _redo:function(t){t.ActionManager.redo(t);},
    _scrolling:function(){
      var top = (typeof window.pageYOffset!="undefined")?window.pageYOffset:document.documentElement.scrollTop;
      $(".cmwysi-fullscreen").css("top",top);
    },
    _resizing:function(){
      var t = wysiwyg
      var toolbar = $(t.iframe).prev();
      var statusbar = $(t.iframe).next();
      if (!t.isFull) return;
      var iframeht = $(window).height()-$(toolbar).height()-($(statusbar).height()*2);
      $(t.iframe)
        .css({width:"100%",height:iframeht})
        .parent().css({width:$(window).width()});
    },
    dynamicContent : function(ev,ed) {
      if(!ed.selection.node.nodeName) {
        return;
      }
      if ((wysiwyg.packages.basic.checkForAnchor)&&(ed.selection.parent.nodeName.toLowerCase()=="a")) {
        $("#dialog input[name='text']").val($(ed.selection.parent).text());
        $("#dialog input[name='link']").val($(ed.selection.node).attr("href"));

        ed.selection.selectFull(ed.selection.parent,ed);
        ed.selection.setSelection(ed.selection.parent);
      } else {
        $("#dialog input[name='text']").val(ed.selection.text);
        if(ed.selection.node.nodeName.toLowerCase()=="a"){$("#dialog input[name='link']").val($(ed.selection.node).attr("href"));}
        else{$("#dialog input[name='link']").val("");}
      }
    },
    insertLink : function() {
      var w = wysiwyg;
      var t = w.active;

      var link=$("#dialog").find("input[name='link']").val();
      var text=$("#dialog").find("input[name='text']").val();

      if (typeof t.selection.obj.pasteHTML=="function"){
        //IE
        var doc=t.iframe[0].contentWindow.document
        html=doc.selection.createRange();
        t.selection.obj.pasteHTML("<a href='"+link+"' title=''>"+text+"</a>");
      } else {
        //FF...
        t.wysiDoc.execCommand("insertHTML",false,"<a href='"+link+"' title=''>"+text+"</a>");
      }
    },
    showSource:function(ed) {
      var w=wysiwyg,iframe, doc, srcArea, t;
      t=w.editors[$(ed.element).attr("id")];
      iframe=t.iframe;
      doc=t.wysiDoc;
      
      srcArea = $(".srcViewTxtArea");
      if (srcArea.length===0){
        srcArea = $("<textarea />")
            					.height($(iframe).height())
            					.width($(iframe).width())
             					.addClass("srcViewTxtArea")
             					.insertBefore(iframe);
      }      					
      $(srcArea).show();
      $(iframe).hide();

      if (! t.htmlView) {
        //Disable all the other buttons, they are no good in Source View.
      	$(".toolbar")
      		.find("[class^='package-']:not(:has(li.control-html))").hide()
      		.end()
      		.find("[class='package-basic'] li:not(.control-html)").hide();

        $(srcArea).val(doc.body.innerHTML);

        t.htmlView=true;
        t.active=false;
      } else {
        //Enable the other buttons again.
      	$(".toolbar")
      		.find("[class^='package-']:not(:has(li.control-html))").show()
			    .end()
			    .find("[class='package-basic'] li:not(.control-html)").show();

        doc.body.innerHTML = $(".srcViewTxtArea").val();
        $(iframe).show();
        $(".srcViewTxtArea").hide();

        t.active=true;
        t.htmlView=false;
      }

      return false;
    }
  };

  wysiwyg.nodechanges.push(wysiwyg.packages.basic._nodechange);
  $.each(wysiwyg.editors,function(){
    this["isFull"]=false;
    this["htmlView"]=false,
    wysiwyg["fullscreen"]={};
  });
})(jQuery);
