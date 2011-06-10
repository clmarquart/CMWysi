(function($){
    wysiwyg.packages["style"]={
      styles:null,
      namespace:"style",
      controls:["styleDrop"],
      _init:function(controls,ed) {
        var cntrl;
        
        if(controls==="*"){
          controls = this.controls;
        }
        var cntrlNm=null;
        var toolUL = $("<ul/>").addClass("package-"+this.namespace);
        for(var c=0;c<controls.length;c++){
          cntrl=null;
          cntrlNm = controls[c];
          switch (cntrlNm) {
            case "styleDrop":
              cntrl=wysiwyg.Controls.createDropDown(cntrlNm,{
                                            id:"style_drop",
                                            title:"Select Style",
                                            events:{"click":this.addStyle}
                                           },ed);

              this.styles = this.styles||loadStyles(wysiwyg.opts.style);
              wysiwyg.Controls.addDropItems(cntrl,this.styles,{"click":wysiwyg.packages.style.addStyle});

              break;
            default:
              break;
          }
          if (cntrl != null) {
            $(toolUL).append(cntrl);
          }
        }
        wysiwyg.ToolbarManager.AddList(ed,toolUL);
      },
      _nodechange:function(j,src,ev) {
        var w=wysiwyg;
        var t=w.active;
        var selnode = src;
        if(typeof selnode.nodeName != "undefined"){
          var sel_class = selnode.className;
          if(sel_class.length>0){
            sel_class = sel_class.split(" ");
            $(t.toolbar.element).find("#control-styleDrop").find("dd").each(function() {
              $(this).find(".dd_content:eq(0)").each(function() {
                if (! $.inArray($(this).text(),sel_class) ) {
                  $(this).prev().html("&bull;").addClass("activeStyleClass");
                  $(t.toolbar.element).find("#control-styleDrop .cm_menuTxt").html($(this).text());
                } else {
                  $(this).prev().html("&nbsp;").removeClass("activeStyleClass");
                }
              });
            });
          }else{
            $(t.toolbar.element)
              .find("#control-styleDrop .cm_menuTxt")
              .text("Select Style")
              .end()
              .find("#control-styleDrop .dd_handle")
              .html("&nbsp;");
          }
        }
      },
      addStyle : function(ev) {
        var bypassNodes = ["tr","table"];
        //Create local version of `wysiwyg` object
        var w = wysiwyg;
        var t = w.active;
        
        //Store the selected style from the menu
        var seld = $(w.utils.eventSource(ev)).text();
        
        //Grab the selected text or cursor point
        var cursel = t.selection;


        //If the selection is collapsed or a full node, we justadd the class.
        //Else, create a wrapper and insert.
        if(cursel.fullNode()){
            addClass(cursel.parent,seld);
        } else if ($.inArray(cursel.node,bypassNodes)) {
            console.log("Bypass.");
            addClass(cursel.node,seld);
        } else {
          //if (cursel.collapsed){}
          var newnode;
          if((cursel.rng!=null) && (typeof cursel.rng.insertNode=="function")) {
            newnode=document.createElement("span");
            newnode.setAttribute("class",seld);
            newnode.innerHTML=cursel.text;
          } else {
            newnode="<span class='"+seld+"'>"+cursel.text+"</span>";
          }
          cursel.replaceSelection(newnode);
        }
      },
      _loaded:function(ed){
        $(ed.wysiDoc)
          .find("head")
          .append($("<link/>")
                    .attr("href",wysiwyg.opts.style)
                    .attr("rel","stylesheet")
                    .attr("type","text/css"));
      }
    };
    
    wysiwyg.loadcalls.push(wysiwyg.packages.style._loaded);
    wysiwyg.nodechanges.push(wysiwyg.packages.style._nodechange);

    function addClass(node,klass) {
        if ($(node).hasClass(klass)){
          $(node).removeClass(klass);
        }else{
          $(node).addClass(klass);
        }
    }

    function loadStyles(ss) {
      var s={};
      for (var css in ss) {
        $.ajax({
          url:ss[css],
          async:false,
          datatype:"text",
          success:function(a){
            var res=a;
            var cur,sels,style;
            var end=res.indexOf("}");
            while(end>=0) {
              cur=$.trim(res.substring(0,end+1));
              sels=cur.substring(0,cur.indexOf("{")).split(",");
              style=$.trim(cur.substring(cur.indexOf("{")+1,cur.indexOf("}")));
              
              for(var sel in sels) {
                sels[sel] = $.trim(sels[sel]);
                if ($.trim(sels[sel].charAt(0)) == ".") {
                  sels[sel] = $.trim(sels[sel]);
                  if (sels[sel].substr(0,1) == "."){
                    sels[sel] = sels[sel].substr(1);
                  }
                  s[sels[sel]] = {name:"style",value:style.replace("\r\n"," ")};
                }
              }
              
              res = res.substring(end+1);
              end = res.indexOf("}");
            }
          }
        });
      }
      
      return s;
    };
})(jQuery);
