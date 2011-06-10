(function($){
  wysiwyg.packages["table"]={
    namespace:"table",
    controls:["table"],
    
    _init : function(controls,ed) {
      var iconbase=wysiwyg.location+"plugins/table/images/";
      var cntrl = {};// = new Object();
      if(controls==="*"){
        controls = this.controls;
      }
      var toolUL = $("<ul/>").addClass("package-"+this.namespace);
      var cntrlNm=null;
      for(var c=0;c<controls.length;c++){
        cntrl = null;
        cntrlNm = controls[c];
        switch (cntrlNm) {
          case "table" :
            cntrl = wysiwyg.Controls.createDialog(cntrlNm,{
                                        icon : iconbase+cntrlNm+".png" ,
                                        width : "200", height : "190",
                                        title : "Insert Table",
                                        tip:"Insert Table",
                                        bgPos:"-200px -18px",
                                        message : {
                                            html:"<div class='row'>Rows: <input type='text' name='rows' value='' /></div>"+
                                                 "<div class='row'>Columns: <input type='text' name='cols' value='' /></div>"+
                                                 "<div class='row'>Header Row: <input type='checkbox' name='th' value='1' /></div>" },
                                        callback : "wysiwyg.packages.table._insertTable"
                                      },ed);

            wysiwyg.context.definitions["td"]={
              "Insert Row":{
                name:"insertRow",
                cmd:"wysiwyg.packages.table._insertRow"
              },
              "Insert Column":{
                name:"insertColumn",
                cmd:"wysiwyg.packages.table._insertColumn"
              }
            };
            wysiwyg.context.definitions["tr"]={
              "Merge Cells":{
                name:"mergeCells",
                cmd:"wysiwyg.packages.table._mergeCells"
              }
            };

            break;
          default:
            break;
        }
        if (cntrl!=null){
          $(toolUL).append(cntrl)
        }
      }
      wysiwyg.ToolbarManager.AddList(ed,toolUL);
    },
    _nodechange:function(){ },
    _buildTable:function(r,c,th){
      var tbl=document.createElement("table");
      tbl.setAttribute("border","1");
      var tbdy=document.createElement("tbody");

      var row, cell;
      for(var rIdx=0;rIdx<r;rIdx++){
        row=document.createElement("tr");
        for(var cIdx=0;cIdx<c;cIdx++){
          if ((rIdx===0) && (th)) {
            cell=document.createElement("th");
          } else {
            cell=document.createElement("td");
          }
          cell.innerHTML="&nbsp;";
          row.appendChild(cell);
        }
        tbdy.appendChild(row);
      }
      tbl.appendChild(tbdy);
      return tbl;
    },
    _insertTable:function(ev){
      var src = $(wysiwyg.utils.eventSource(ev)).closest(".ui-dialog");
      var rows=$(src).find("input[name='rows']").val();
      var cols=$(src).find("input[name='cols']").val();
      var th  =$(src).find("input[name='th']").is(":checked");

      //Grab the selected text or cursor point
      var cursel = wysiwyg.active.selection;

      if(cursel.rng==null) {
        return;
      }

      var newnode = wysiwyg.packages.table._buildTable(rows,cols,th);
      console.log(newnode);
      cursel.replaceSelection(newnode);
    },
    _insertRow:function(){
      var t=wysiwyg.active;

      t.ActionManager.snap(t);
      var tr = $(t.selection.parent).closest("tr");
      var tds=$(tr).find("td");
      var tdhtml = "";
      for (var x=0;x<tds.length;x++){
        tdhtml+="<td>&nbsp;</td>";
      }
      $(t.selection.node).closest("tr").after("<tr>"+tdhtml+"</tr>");
    },
    _insertColumn:function(){
      var t=wysiwyg.active;
      var tr=(t.selection.node.nodeName.toLowerCase()=="tr")?t.selection.node:$(t.selection.node).closest("tr")[0];

      t.ActionManager.snap(t);
      $(tr).data("row-id",1).append($("<td/>").html("&nbsp;"));
      var cntCells=$(tr).find("td").length;

      $(tr).closest("table").find("tr").each(function(){
        if($(this).find("td").length<cntCells){
          //$(this).find("td:last").attr("colspan",1+(cntCells-$(this).find("td").length));
          $(this).append($("<td/>").html("&nbsp;"));
        }
      });
    },
    _mergeCells:function(){
      var t=wysiwyg.active;

      t.ActionManager.snap(t);
      var html="";
      var tr=$(t.selection.node).closest("tr");
      $(tr).find("td").each(function(){
        html+=$(this).html();
      });
      $(tr).html("<td colspan='"+this._countCells($(t.selection.node).closest("table"))+"'>"+html+"</td>");
    },
    _countCells:function(tbl){
      var max=0;
      if($(tbl).find("tr").length>1){
        $(tbl).find("tr").each(function(){
          max=($(this).find("td").length>max)?$(this).find("td").length:max;
        });
      } else {
        max=1;
      }
      return max;
    }
  };

  //wysiwyg.nodechanges.push(wysiwyg.plugins.table._nodechange);
})(jQuery);
