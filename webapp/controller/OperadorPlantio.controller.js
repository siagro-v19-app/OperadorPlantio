sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"br/com/idxtecOperadorPlantio/services/Session",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(Controller, MessageBox, JSONModel, Session, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("br.com.idxtecOperadorPlantio.controller.OperadorPlantio", {
		onInit: function(){
			var oJSONModel = new JSONModel();
			
			this._operacao = null;
			this._sPath = null;

			this.getOwnerComponent().setModel(oJSONModel, "model");
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			this.getModel().attachMetadataLoaded(function(){
				var oFilter = new Filter("Empresa", FilterOperator.EQ, Session.get("EMPRESA_ID"));
				var oView = this.getView();
				var oTable = oView.byId("tableOperador");
				var oColumn = oView.byId("columnNome");
				
				oTable.sort(oColumn);
				oView.byId("tableOperador").getBinding("rows").filter(oFilter, "Application");
			});
		},
		
		filtraOperador: function(oEvent){
			var sQuery = oEvent.getParameter("query");
			var oFilter1 = new Filter("Empresa", FilterOperator.EQ, Session.get("EMPRESA_ID"));
			var oFilter2 = new Filter("Nome", FilterOperator.Contains, sQuery);
			
			var aFilters = [
				oFilter1,
				oFilter2
			];

			this.getView().byId("tableOperador").getBinding("rows").filter(aFilters, "Application");
		},
		
		onRefresh: function(){
			var oModel = this.getOwnerComponent().getModel();
			oModel.refresh(true);
			this.getView().byId("tableOperador").clearSelection();
		},
		
		onIncluir: function(){
			var oDialog = this._criarDialog();
			var oTable = this.byId("tableOperador");
			var oJSONModel = this.getOwnerComponent().getModel("model");
			var oViewModel = this.getModel("view");
			
			oViewModel.setData({
				titulo: "Inserir Operador de Plantio"
			});
			
			this._operacao = "incluir";
			
			var oNovoOperador = {
				"Id": 0,
				"Nome": "",
				"CustoHora": 0.00,
				"Empresa" : Session.get("EMPRESA_ID"),
				"Usuario": Session.get("USUARIO_ID"),
				"EmpresaDetails": { __metadata: { uri: "/Empresas(" + Session.get("EMPRESA_ID") + ")"}},
				"UsuarioDetails": { __metadata: { uri: "/Usuarios(" + Session.get("USUARIO_ID") + ")"}}
			};
			
			oJSONModel.setData(oNovoOperador);
			
			oTable.clearSelection();
			oDialog.open();
		},
		
		onEditar: function(){
			var oDialog = this._criarDialog();
			var oTable = this.byId("tableOperador");
			var nIndex = oTable.getSelectedIndex();
			var oModel = this.getOwnerComponent().getModel();
			var oJSONModel = this.getOwnerComponent().getModel("model");
			var oViewModel = this.getModel("view");
			
			oViewModel.setData({
				titulo: "Editar Operador de Plantio"
			});
			
			this._operacao = "editar";
			
			if(nIndex === -1){
				MessageBox.warning("Selecione um operador da tabela!");
				return;
			}
			
			var oContext = oTable.getContextByIndex(nIndex);
			this._sPath = oContext.sPath;
			
			oModel.read(oContext.sPath, {
				success: function(oData){
					oJSONModel.setData(oData);
				}
			});
			
			oTable.clearSelection();
			oDialog.open();
		},
		
		onRemover: function(){
			var that = this;
			var oTable = this.byId("tableOperador");
			var nIndex = oTable.getSelectedIndex();
			
			if(nIndex === -1){
				MessageBox.warning("Selecione um operador na tabela!");
				return;
			}
			
			MessageBox.confirm("Deseja remover esse operador?", {
				onClose: function(sResposta){
					if(sResposta === "OK"){
						that._remover(oTable, nIndex);
						MessageBox.success("Operador removido com sucesso!");
					}
				} 
			});
		},
		
		onSaveDialog: function(){
			if (this._checarCampos(this.getView())) {
				MessageBox.warning("Preencha todos os campos obrigatórios!");
				return;
			}
			if(this._operacao === "incluir"){
				this._createOperador();
				this.getView().byId("OperadorPlantioDialog").close();
			} else if(this._operacao === "editar"){
				this._updateOperador();
				this.getView().byId("OperadorPlantioDialog").close();
			} 
		},
		
		onCloseDialog: function(){
			var oModel = this.getOwnerComponent().getModel();
			
			if(oModel.hasPendingChanges()){
				oModel.resetChanges();
			}
			
			this.byId("OperadorPlantioDialog").close();
		},
		
		_remover: function(oTable, nIndex){
			var oModel = this.getOwnerComponent().getModel();
			var oContext = oTable.getContextByIndex(nIndex);
			
			oModel.remove(oContext.sPath, {
				success: function(){
					oModel.refresh(true);
					oTable.clearSelection();
				}
			});
		},
		
		_getDados: function(){
			var oJSONModel = this.getOwnerComponent().getModel("model");
			var oDados = oJSONModel.getData();
			debugger;
			return oDados;
		},
		
		_createOperador: function(){
			var oModel = this.getOwnerComponent().getModel();
	
			oModel.create("/OperadorPlantios", this._getDados(), {
				success: function() {
					MessageBox.success("Operador inserido com sucesso!");
					oModel.refresh(true);
				}
			});
		},
		
		_updateOperador: function(){
			var oModel = this.getOwnerComponent().getModel();
			
			oModel.update(this._sPath, this._getDados(), {
				success: function(){
					MessageBox.success("Operador alterado com sucesso!");
					oModel.refresh(true);
				}
			});
		},
		
		_criarDialog: function(){
			var oView = this.getView();
			var oDialog = this.byId("OperadorPlantioDialog");
			
			if(!oDialog){
				oDialog = sap.ui.xmlfragment(oView.getId(), "br.com.idxtecOperadorPlantio.view.GravarOperador", this);
				oView.addDependent(oDialog); 
			}
			return oDialog;
		},
		
		_checarCampos: function(oView){
			if(oView.byId("nome").getValue() === ""){
				return true;
			} else{
				return false; 
			}
		},
		
		getModel: function(sModel) {
			return this.getOwnerComponent().getModel(sModel);
		}
	});
});