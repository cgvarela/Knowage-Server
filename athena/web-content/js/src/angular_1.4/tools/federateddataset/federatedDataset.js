var app = angular.module('FEDERATIONDEFINITION', ['ngMaterial','angular_rest','angular_list']);

app.service('translate', function() {
	this.load = function(key) {
		return messageResource.get(key, 'messages');
	};
});

app.controller('FederationDefinitionCTRL', [ "translate", "restServices", "$scope",
                   		"$mdDialog", funkcija]);

function funkcija(translate, restServices, $scope, $mdDialog) {
	ctr = this;
	$scope.translate =  translate;
	
	//data from the fields of saveFederateddataset.html
	$scope.federateddataset = {};
	$scope.update = {};
	$scope.update = $scope.federateddataset;
	angular.toJson($scope.update);
	
	ctr.list = {};
	ctr.listaNew = [];
	ctr.listAllO = {};
	ctr.listAll = [];
	
	//state is used to show or hide components on the page
	ctr.state = true;
	ctr.isEditState = false;
	
	ctr.relation = "";
	ctr.relNew = null;
	ctr.associationArray = [];
	ctr.beforeRel = {};
	ctr.multiArray = [];
	ctr.bla = {}
	
	ctr.item = {};
	ctr.selectedVariable = {};
	ctr.myselectedvariable = {};
	
	ctr.fillTheArray = function() {
		var check = false;
		var obj1 = ctr.createAssociations();
		var counter = 0;
		
		angular.forEach(ctr.listaNew, function(dataset){
			angular.forEach(dataset.metadata.fieldsMeta, function(listField){
				if(listField.selected==true){
					counter +=1;
				}
			});
		});
		
		if(counter==0){
			$mdDialog.show(
					$mdDialog.alert()
						.clickOutsideToClose(true)
						.content('You didn\'t select any field!')
						.ok('Got it!')
			);
		} else if(counter==1){
			$mdDialog.show(
					$mdDialog.alert()
						.clickOutsideToClose(true)
						.content('You selected only 1 field! You have to select at least two fields to create a relation.')
						.ok('OK')
			);
		} else{
			if(ctr.multiArray.length==0){
				ctr.multiArray.push(ctr.createAssociations());
			} else {
				angular.forEach(ctr.multiArray, function(obj2){
					if(JSON.stringify(obj1) === JSON.stringify(obj2)){
						check = true;
						console.log("The relation is already created!")
						$mdDialog.show(
								$mdDialog.alert()
									.clickOutsideToClose(true)
									.content('The relation is already created!')
									.ok('Got it!')
						);
					}
				});
				if(!check){
					console.log("Add new to array.")
					ctr.multiArray.push(ctr.createAssociations());
				}
			}
		}
	}
	
	ctr.createAssociations = function(){
		var RelationshipsArray = [];
		var checkBranch = false;
		angular.forEach(ctr.listaNew, function(dataset){
			if(checkBranch==false){
				console.log(checkBranch+"branch");
				angular.forEach(dataset.metadata.fieldsMeta, function(listField){
					if(listField.selected){
						console.log('selected field');
						ctr.beforeRel = dataset;
						ctr.beforeRel.firstSelectedListField = listField.name;
						ctr.beforeRel.ime = dataset.name;
						checkBranch = true;
					}
				});
			} else {
				console.log(checkBranch+"branch");
				angular.forEach(dataset.metadata.fieldsMeta, function(polje){
					if(polje.selected){
						var t = {
								bidirectional: true,
						        cardinality: 'many-to-one',
						        sourceTable: {
						            name: '',
						            className: ''
						        },
						        sourceColumns: [],
						        destinationTable: {
						            name: '',
						            className: ''
						        }, 
						        destinationColumns: []
						}
						
						t.sourceTable.name = ctr.beforeRel.ime;
						t.sourceTable.className = ctr.beforeRel.ime;
						t.sourceColumns.push(ctr.beforeRel.firstSelectedListField);
						
						t.destinationTable.name = dataset.name;
						t.destinationTable.className = dataset.name;
						t.destinationColumns.push(polje.name);
						
						ctr.beforeRel = polje;
						ctr.beforeRel.ime = dataset.name;
						ctr.beforeRel.firstSelectedListField = polje.name;
						
						RelationshipsArray.push(t);
					}
				});
			}
		});
		return RelationshipsArray;
	}
	
	ctr.showAdvanced = function(ev){
		if(ctr.multiArray.length==0){
			$mdDialog.show(
					$mdDialog.alert()
						.clickOutsideToClose(true)
						.content('You didn\'t create any relationships!')
						.ok('OK')
			);
		} else{
			$mdDialog
				.show({
					scope: $scope,
					preserveScope: true,
					controllerAs: 'feddsCtrl',
					controller: function($mdDialog) {
						var fdsctrl = this;
						fdsctrl.saveFedDataSet = function() {
							console.log(ctr.multiArray);
							var item = {};
							item.name = $scope.update.name;
							item.label = $scope.update.label;
							item.description = $scope.update.description;
							item.relationships = "";
							item.relationships = ctr.multiArray;
							
							restServices.post("federateddataset","post",item)
								.success(console.log("success"))
								.error(console.log("error"))
						}
					},
					templateUrl: '/athena/js/src/angular_1.4/tools/federateddataset/commons/templates/saveFederatedDatasetTemp.html',
					targetEvent: ev
				});
		}
	}
	
	ctr.showDSDetails = function(param) {
		
		angular.forEach(ctr.list, function(dataset){
			if(dataset.name==param.name && dataset.label==param.label && dataset.description==param.description){
				$scope.dsname = dataset.name;
				$scope.dslabel = dataset.label;
				$scope.dsdescription = dataset.description;
			}
		});
		
		$mdDialog
			.show({
				scope: $scope,
				preserveScope: true,				
				templateUrl: '/athena/js/src/angular_1.4/tools/federateddataset/commons/templates/datasetDetails.html',
				targetEvent: param
			});
	}

	ctr.selektuj = function(item, listId){
		if(ctr.myselectedvariable[listId]!=undefined || ctr.myselectedvariable[listId]!=null){
			if(item.name==ctr.myselectedvariable[listId].name){
				ctr.myselectedvariable[listId] = null;
				console.log("Field is unhighlighted.")
			}
		}
		angular.forEach(ctr.listaNew, function(dataset){
			if(dataset.label==listId){
				angular.forEach(dataset.metadata.fieldsMeta, function(listField){
					if(listField.name==item.name){
						if(listField.selected==true){
							listField.selected = false;
							ctr.selectedVariable = null; //chechk this
						} else {
							angular.forEach(dataset.metadata.fieldsMeta, function(att){
								att.selected = false;
							});
							listField.selected = true;
						}
					} else {
						//listField.name==item.name
					}
				});
			} else {
				//dataset.label==listId
			}
		});
	}
	
	restServices.get("2.0/datasets","")
		.success(
				function(data, status, headers, config){
					if(data.hasOwnProperty("errors")) {
						console.log(data.errors[0].message);
					} else {
						ctr.list = data;
						console.log("List:")
						console.log(ctr.list)
						angular.forEach(ctr.list, function(dataset){
							////Fix for --> TypeError: Cannot read property 'fieldsMeta' of null
							if(dataset.metadata==null){
								dataset.metadata.fieldsMeta = [];
							}
							angular.forEach(dataset.metadata.fieldsMeta, function(listField){
								
								listField.selected =  false;
							});
						});
					}
				}
		)
		.error(
				function(data, status, headers, config) {
					// called asynchronously if an error occurs
				    // or server returns response with an error status.
					console.log("Datasets not obtained " + status);
				}
		)
		
	restServices.get("2.0/datasets","")
		.success(
				function(data, status, headers, config){
					if(data.hasOwnProperty("errors")) {
						console.log(data.errors[0].message);
					} else {
						ctr.listAllO = data;
						console.log("ListALLO:")
						console.log(ctr.listAllO)
						angular.forEach(ctr.listAllO, function(dataset){
							//Fix for --> TypeError: Cannot read property 'fieldsMeta' of null
							if(dataset.metadata==null){
								dataset.metadata.fieldsMeta = [];
							}
							angular.forEach(dataset.metadata.fieldsMeta, function(listField){
								listField.selected =  false;
							});
						});
					}
				}
		)
		.error(
				function(data, status, headers, config) {
					// called asynchronously if an error occurs
				    // or server returns response with an error status.
					console.log("Datasets not obtained " + status);
				}
		)
		
	ctr.kickOutFromListNew = function(param) {
		ctr.nizSourceva = [];
		for (var i = 0; i < ctr.multiArray.length; i++) {
			for (var j = 0; j < ctr.multiArray[i].length; j++) {
				if(j==0){
					ctr.nizSourceva.push(ctr.multiArray[i][j].sourceTable.name)
					ctr.nizSourceva.push(ctr.multiArray[i][j].destinationTable.name)
				} else {
					ctr.nizSourceva.push(ctr.multiArray[i][j].destinationTable.name)
				}
				
			}
		}
			console.log(ctr.nizSourceva.length)
			if(ctr.nizSourceva==0){
				var index = ctr.listaNew.indexOf(param);
				if (index != -1) {
					ctr.listaNew.splice(index, 1);
				}
				if (ctr.list.indexOf(param) === -1) {
					ctr.list.push(param);
				} else {
					console.log("Parameter is already in the list.");
				}
			} else {
				if (ctr.nizSourceva.indexOf(param.label) >= 0) {
					
					console.log("param leb")
					console.log(param.label)
					$mdDialog
							.show($mdDialog
									.alert()
									.clickOutsideToClose(true)
									.content(
											'You can\'t delete the dataset! It is used in a relationship! To delete this dataset you have to remove the relationship first.')
									.ok('OK'));
					return false;
					
				} else {
					console.log("else" + j)
					var index = ctr.listaNew.indexOf(param);
					if (index != -1) {
						ctr.listaNew.splice(index, 1);
					}
					if (ctr.list.indexOf(param) === -1) {
						ctr.list.push(param);
					} else {
						console.log("Parameter is already in the list.");
					}
				}
			}
				/*console.log("ceo niz objekata")
				console.log(ctr.multiArray)
				console.log("param: "+param.label)
				console.log("jedan od uslova")
				console.log("sourcetable: "+ctr.multiArray[i][j].sourceTable.name)
				console.log("destination:"+ctr.multiArray[i][j].destinationTable.name)*/
			
				//for (var i = 0; i < ctr.nizSourceva.length; i++) {
					//if (param.label == ctr.nizSourceva[i]) {
			
			/*if (ctr.nizSourceva.indexOf(param.label) >= 0) {
						
						console.log("param leb")
						console.log(param.label)
						$mdDialog
								.show($mdDialog
										.alert()
										.clickOutsideToClose(true)
										.content(
												'You can\'t delete the dataset! It is used in a relationship! To delete this dataset you have to remove the relationship first.')
										.ok('OK'));
						return false;
						
					} else {
						console.log("else" + j)
						var index = ctr.listaNew.indexOf(param);
						if (index != -1) {
							ctr.listaNew.splice(index, 1);
						}
						if (ctr.list.indexOf(param) === -1) {
							ctr.list.push(param);
						} else {
							console.log("Parameter is already in the list.");
						}
					}*/
				//}
				
				
			
			
			
	}
	
	ctr.moveToListNew = function(param) {
		var index = ctr.list.indexOf(param);
		console.log("Index"+index);
		if(index != -1) {
			ctr.list.splice(index,1);
		}
		if(ctr.listaNew.indexOf(param)===-1){
			ctr.listaNew.push(param);
			console.log("dodao u novu listu")
		} else {
			console.log("Parametar is already in the list.")
		}
	}
	
	ctr.toggle = function() {
		if(ctr.listaNew.length==0){
			$mdDialog.show(
					$mdDialog.alert()
						.clickOutsideToClose(true)
						.content('You didn\'t select any datasets!')
						.ok('OK')
			);
		} else if (ctr.listaNew.length==1){
			$mdDialog.show(
					$mdDialog.alert()
						.clickOutsideToClose(true)
						.content('Select at least two datasets!')
						.ok('Ok')
			);
		} else {
			ctr.state=!ctr.state;
		}
	}
	
	ctr.toggleBack = function() {
		ctr.state=!ctr.state;
	}
	
	ctr.kickOutFromAssociationArray = function(param) {//ispitati
		var index = ctr.associationArr.indexOf(param);
		if(index != -1){
			ctr.associationArray.splice(index, 1);
		}
	}
	
	ctr.deleteFromMultiArray = function(param) {
		var confirm = $mdDialog.confirm()
		.title('Confirm delete')
		.content('Are you sure you want to delete the relationship?')
		.targetEvent(param)
		.ok('Yes')
		.cancel('No')
		
		$mdDialog.show(confirm).then(function(){
			var index = ctr.multiArray.indexOf(param);
			if(index !=-1){
				ctr.multiArray.splice(index, 1);
			}
		})
		
	}
	
	ctr.hide = function(){
		$mdDialog.cancel();
	}
	
	ctr.showAlert = function(ev){ //premesti u saveFedDataSet
		$mdDialog.show(
				$mdDialog.alert()
					.clickOutsideToClose(true)
					.title('Operation succeded')
					.ok('OK')
					.targetEvent(ev)
		);
	}
	
	ctr.glossSpeedMenuOpt = [ 			 		               	
		 		               	{
		 		               		label: 'Delete',
		 		               		icon:"fa fa-trash-o",
		 		               		backgroundColor:'red',
		 		               		action : function(param) {
		 		               			ctr.kickOutFromListNew(param);
		 		               			}
		 		               	}
		 		             ];

	ctr.glossSpeedMenuOptAD = [ 			 		               	
		 		               	{
		 		               		label: 'Info',
		 		               		icon:"fa fa-info-circle",
		 		               		backgroundColor:'green',
		 		               		action : function(ev) {
		 		               				ctr.showDSDetails(ev);
		 		               			}
		 		               	}
		 		             ];
	
	//FAB Speed Dial customization for deleting and editing a relationship
	ctr.selectedDirection = 'left';
    ctr.selectedMode = 'md-scale';
    
    ctr.prepRelForEdit = function(param) {
    	var confirm = $mdDialog.confirm()
		.title('Confirm dialog')
		.content('Are you sure you want to edit the relation? The previous relation will be lost.')
		.targetEvent(param)
		.ok('Yes')
		.cancel('No')
		
		$mdDialog.show(confirm).then(function(){
			ctr.isEditState = true;
	    	ctr.listaNew = [];
	    	ctr.glupalista = [];
	    	
	    	for (var int = 0; int < param.length; int++) {
				if(int==0){
					ctr.glupalista.push(param[int].sourceTable.name);
					ctr.glupalista.push(param[int].destinationTable.name);
				} else{
					ctr.glupalista.push(param[int].destinationTable.name);
				}
			}
	    	
	    	for (var int = 0; int < ctr.glupalista.length; int++) {
	    		angular.forEach(ctr.listAllO, function(dataset){
	        		if(dataset.name==ctr.glupalista[int]){
	        			console.log(dataset)
	        			ctr.listaNew.push(dataset);
	        		}
	        	});
			}
	    	
	    	var index = ctr.multiArray.indexOf(param);
			if(index !=-1){
				ctr.multiArray.splice(index, 1);
			}
		})
    }
    
    ctr.saveEditedRelation = function() {
    	ctr.isEditState = false;
    	ctr.multiArray.push(ctr.createAssociations());
    }
    
    ctr.cancelEdit = function() {
    	ctr.isEditState = false;
    }    
    
}



