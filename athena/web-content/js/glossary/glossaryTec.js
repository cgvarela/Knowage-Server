var app = angular.module('AIDA_GLOSSARY_TECNICAL_USER', [ 'ngMaterial','ui.tree', 'angular_rest','angularUtils.directives.dirPagination' ]);

app.config(function($mdThemingProvider) {
	$mdThemingProvider.theme('default').primaryPalette('grey').accentPalette(
			'blue-grey');
});


app.service('translate', function() {
	this.load = function(key) {
		return messageResource.get(key, 'messages');
	};
});

app.controller('Controller', [ "translate", "restServices", "$q", "$scope",
                       		"$mdDialog", "$filter", "$timeout", "$mdToast", funzione ]);


var listDocument = [{
	DOCUMENT_ID :0,
	DOCUMENT_NM : "DOC1",
},{
	DOCUMENT_ID :1,
	DOCUMENT_NM : "DOC2",
}
				]

function funzione(translate, restServices, $q, $scope, $mdDialog, $filter,
		$timeout, $mdToast) {
	ctrl=this;
	ctrl.listDoc;
	ctrl.glossary;
	ctrl.showPreloader = false;
	ctrl.preloaderTree= false;
	ctrl.selectedGloss;
	ctrl.selectedDocument;
	getAllGloss();
	getAllDoc();
	 ctrl.words = [];
	
	

	ctrl.DocumentLike= function(ele){
		console.log("DocumentLike "+ele);
		}
	
	ctrl.prevSWSG = "";
	ctrl.tmpSWSG = "";
	ctrl.SearchWordInSelectedGloss= function(ele){
		console.log("SearchWordInSelectedGloss  "+ele);
		ctrl.tmpSWSG = ele;
		$timeout(function() {
			if (ctrl.tmpSWSG != ele || ctrl.prevSWSG == ele) {
				console.log("interrompo la ricerca  di ele " + ele)
				return;
			}

			ctrl.prevSWSG = ele;
			
			console.log("cerco "+ele)
			showPreloader("preloaderTree");
			restServices.get("glossary", "glosstreeLike", "WORD=" + ele+"&GLOSSARY_ID="+ctrl.selectedGloss.GLOSSARY_ID).success(
					function(data, status, headers, config) {
						console.log("glosstreeLike Ottenuti " + status)
						console.log(data)

						if (data.hasOwnProperty("errors")) {
							showErrorToast(data.errors[0].message);
							showToast(
									translate.load("sbi.glossary.load.error"),
									3000);

						} else {
							ctrl.selectedGloss=data.GlossSearch;
							
							if(ele!=""){
							$timeout(function() {
								ctrl.expandAllTree("GlossTree");
							},500);
							}
						}
						hidePreloader("preloaderTree");

					}).error(function(data, status, headers, config) {
				console.log("glosstreeLike non Ottenuti " + status);
				showToast(translate.load("sbi.glossary.load.error"), 3000);

				hidePreloader("preloaderTree");
			})

		}, 1000);
	}
	
	ctrl.removeWord= function(word){
		console.log("remove word");
		console.log(word);
		
		var confirm = $mdDialog.confirm().title(
				translate.load("sbi.glossary.word.delete")).content(
				translate.load("sbi.glossary.word.delete.message")).ariaLabel(
				'Lucky day').ok(translate.load("sbi.generic.delete")).cancel(
				translate.load("sbi.myanalysis.delete.cancel")).targetEvent(word);
		
			$mdDialog.show(confirm).then(
						function() {
						
							showPreloader();
							restServices.remove("glossary", "deleteDocWlist",
											"WORD_ID=" + word.WORD_ID+"&DOCUMENT_ID="+ctrl.selectedDocument)
									.success(
											function(data, status, headers,
													config) {
												console.log("Word eliminato")
												console.log(data)
												if (data.hasOwnProperty("errors")) {
													showErrorToast(data.errors[0].message)
													showToast(translate.load("sbi.glossary.word.delete.error"),3000);

												} else {
													ctrl.words.splice(ctrl.words.indexOf(word), 1);
													showToast(translate.load("sbi.glossary.word.delete.success"),3000);
													
													
												}
												hidePreloader();

											})
									.error(
											function(data, status, headers,
													config) {
												console.log("WORD NON ELMINIATO "+ status);
												showErrorToast("word non eliminato "+ status);
												showToast(translate.load("sbi.glossary.word.delete.error"),3000);
												hidePreloader();
											})


						}, function() {
							console.log('Annullo.');
						});
		
		
		
		
	}
	
	
	ctrl.loadDocumentInfo= function(DOCUMENT_ID){
		console.log("loadDocumentInfo");
		ctrl.words=[];
		ctrl.searchDoc="";
		showPreloader("preloader");
		restServices
				.get(
						"glossary","getDocumentInfo","DOCUMENT_ID=" + DOCUMENT_ID )
				.success(
						function(data, status, headers, config) {
							console.log("loadDocumentInfo ottnuti")
							console.log(data)

							if (data.hasOwnProperty("errors")) {
								showErrorToast(data.errors[0].message);
								showToast(translate.load("sbi.glossary.load.error"), 3000);

							} else {
								ctrl.words=data.word;
								
								
								
							}
							
							hidePreloader("preloader");
						}).error(function(data, status, headers, config) {
					console.log("nodi non ottenuti " + status);
					showToast(translate.load("sbi.glossary.load.error"), 3000);
					if (togg != undefined) {
						togg.expand();
						hidePreloader("preloader");
					}
				})
	}
	
	
	ctrl.showSelectedGlossary = function(gloss) {
		if(ctrl.selectedGloss!=undefined && ctrl.selectedGloss.GLOSSARY_ID==gloss.GLOSSARY_ID){return;}
		
		
		ctrl.selectedGloss=gloss;
		ctrl.getGlossaryNode(ctrl.selectedGloss, null);
	}
	
	
	
	ctrl.getGlossaryNode = function(gloss, node, togg) {
		console.log("getGlossaryNode")
		console.log(node)
		console.log(gloss)
		console.log(togg);
		var PARENT_ID = (node == null ? null : node.CONTENT_ID);
		var GLOSSARY_ID = (gloss == null ? null : gloss.GLOSSARY_ID);
	
		showPreloader("preloaderTree");
		restServices
				.get(
						"glossary",
						"listContents",
						"GLOSSARY_ID=" + GLOSSARY_ID + "&PARENT_ID="
								+ PARENT_ID)
				.success(
						function(data, status, headers, config) {
							console.log("nodi ottnuti")
							console.log(data)

							if (data.hasOwnProperty("errors")) {
								showErrorToast(data.errors[0].message);
								showToast(translate.load("sbi.glossary.load.error"), 3000);

							} else {
								
								if(togg==undefined || togg.collapsed){
								//check if parent is node or glossary
								node==null ? gloss.SBI_GL_CONTENTS = data : node.CHILD = data;
								}else{
									console.log("riordino manualmente");
									if(node!=null){
										node.CHILD.sort(function(a,b) {return (a.CONTENT_NM > b.CONTENT_NM) ? 1 : ((b.CONTENT_NM > a.CONTENT_NM) ? -1 : 0);} ); 
									}
								}

								if (togg != undefined) {
									togg.expand();
								}
								if(node!=null && node.hasOwnProperty("preloader")){
									node.preloader = false;
								}
								hidePreloader("preloaderTree");
							}
						}).error(function(data, status, headers, config) {
					console.log("nodi non ottenuti " + status);
					showToast(translate.load("sbi.glossary.load.error"), 3000);
					if (togg != undefined) {
						togg.expand();
						hidePreloader("preloaderTree");
					}
				})
	}
	
	
	ctrl.expandAllTree= function(tree){
		console.log("expand")
		angular.element(document.getElementById(tree)).scope().expandAll();
	}
	
	
	ctrl.toggle = function(scope, item, gloss) {
		
		console.log("toggle")
		
		if(ctrl.searchDoc!="" && ctrl.searchDoc!=undefined ){
			scope.toggle();
			return;	
		}
		
		console.log(scope)
		item.preloader = true;
		if (scope.collapsed) {
			ctrl.getGlossaryNode(gloss, item, scope)
		} else {
			scope.toggle();
			item.preloader = false;
		}
	};
	
	function getAllGloss() {
		console.log("getAllGloss")
		showPreloader();
		restServices.get("glossary", "listGlossary").success(
				function(data, status, headers, config) {
					console.log("Glossary Ottenuti " + status)
					console.log(data)
					if (data.hasOwnProperty("errors")) {
						showErrorToast(data.errors[0].message);
						showToast(translate.load("sbi.glossary.load.error"),
								3000);

					} else {
						ctrl.glossary = data;
					}

					hidePreloader();
				}).error(function(data, status, headers, config) {
			console.log("Glossary non Ottenuti " + status);
			showErrorToast('Ci sono errori! \n status ' + status);
			showToast(translate.load("sbi.glossary.load.error"), 3000);

			hidePreloader();
		})

	}
	
	
	function getAllDoc() {
		console.log("getAllDoc")
		showPreloader();
		restServices.get("glossary", "listDocument").success(
				function(data, status, headers, config) {
					console.log("doc Ottenuti " + status)
					console.log(data)
					if (data.hasOwnProperty("errors")) {
						showErrorToast(data.errors[0].message);
						showToast(translate.load("sbi.glossary.load.error"),
								3000);

					} else {
						ctrl.listDoc = data;
					}

					hidePreloader();
				}).error(function(data, status, headers, config) {
			console.log("Glossary non Ottenuti " + status);
			showErrorToast('Ci sono errori! \n status ' + status);
			showToast(translate.load("sbi.glossary.load.error"), 3000);

			hidePreloader();
		})

	}
	
	
	ctrl.WordItemPerPage=10;
	ctrl.DocItemPerPage=10;
	changeItemPP();
	function changeItemPP() {
		console.log("changeItemPP")
		var boxItemGlo = angular.element(document.querySelector('.boxItemGlo'))[0].offsetHeight;
		var tbw = angular.element(document.querySelector('.minihead'))[0].offsetHeight;
		var bpw = angular.element(document.querySelector('.box_pagination'))[0].offsetHeight;

		 bpw == 0 ? bpw = 19 : bpw = bpw;
		
		 
		 console.log(boxItemGlo)
		 		 console.log(tbw)
		 		 		 console.log(bpw)
		  
		 		 		 
		 
		ctrl.WordItemPerPage=parseInt((boxItemGlo - tbw - bpw -5 ) / 28);
		ctrl.DocItemPerPage=parseInt((boxItemGlo - tbw - bpw -5  ) / 16);
		console.log(ctrl.WordItemPerPage) 		
		console.log(ctrl.DocItemPerPage) 		
	}
	
	$scope
	.$watch(
			function() {
				return angular.element(document.querySelector('.glossaryTec'))[0].offsetHeight;
			}, function(newValue, oldValue) {
				console.log("watch")
				if (newValue != oldValue) {
					changeItemPP();
				}
			}, true);
	
	
	
	
	
	
	
	
	
	ctrl.TreeOptionsWord = {

			accept : function(sourceNodeScope, destNodesScope, destIndex) {
				
//				if(destNodesScope.hasChild(sourceNodeScope.$modelValue)){
//					console.log(destNodesScope.hasChild(sourceNodeScope.$modelValue))
//					return false;
//				}
//				console.log(destNodesScope.$modelValue.toString());
				var present=false;
				for(var i=0;i<destNodesScope.$modelValue.length;i++){
					if(destNodesScope.$modelValue[i].WORD_ID==sourceNodeScope.$modelValue.WORD_ID){
					console.log("word present")	;
					present= true;
					break;
					}
				}
				if(present){ return false;}
				else{console.log("accepted");
				return true;}
				
				
				
			},
			beforeDrop : function(event) {
				console.log("dropped")
			},
			dragStart : function(event) {
			},
			dragStop : function(event) {
			}
		};
	
	ctrl.TreeOptions = {

			accept : function(sourceNodeScope, destNodesScope, destIndex) {
				console.log("accept")
				return false;
			},
			beforeDrop : function(event) {
			console.log("beforeDrop TreeOptions")
			console.log(event)
			
			if(event.source.nodesScope.$id==event.dest.nodesScope.$id){
				console.log("no drop ")
				return false;
			}
			
				var elem = {};

				elem.WORD_ID = event.source.nodeScope.$modelValue.WORD_ID;
				elem.DOCUMENT_ID=ctrl.selectedDocument;
				console.log(elem)
			
				showPreloader();
				restServices
				.post("glossary", "addDocWlist", elem)
				.success(
						function(data, status, headers,
								config) {

							if (data
									.hasOwnProperty("errors")) {
								showErrorToast(data.errors[0].message)
								showToast(
										translate
												.load("sbi.glossary.error.save"),
										3000);
							} else if (data.Status == "NON OK") {
								showToast(
										translate
												.load(data.Message),
										3000);
							} else {
//								showToast(
//										translate
//												.load("sbi.glossary.success.save"),
//										3000);

							
//								event.dest.nodesScope.insertNode(event.dest.index,elem);
							}
							
							
							
							hidePreloader();
						})
				.error(
						function(data, status, headers,
								config) {
							hidePreloader();
							showToast(
									translate
											.load("sbi.glossary.error.save"),
									3000);
						});
				
				
				
			},
			dragStart : function(event) {
			},
			dragStop : function(event) {
			}
		};
	
	
	function showErrorToast(err, time) {
		var timer = time == undefined ? 6000 : time
		console.log("ci sono errori")
		console.log(err)
		hidePreloader();
		// $mdToast.show($mdToast.simple().content('Ci sono errori! \n ' + err)
		// .position('top').action('OK').highlightAction(false).hideDelay(
		// timer));
	}

	function showToast(text, time) {
		var timer = time == undefined ? 6000 : time;

		console.log(text)
		$mdToast.show($mdToast.simple().content(text).position('top').action(
				'OK').highlightAction(false).hideDelay(timer));
	}

	function showPreloader(pre) {
		switch(pre){
		case 'preloaderTree':ctrl.preloaderTree=true;
							break;
		default:ctrl.showPreloader = true;
				break;
		}
	}
	
	function hidePreloader(pre) {
		switch(pre){
		case 'preloaderTree':ctrl.preloaderTree=false;
							break;
		default:ctrl.showPreloader = false;
				break;
		}
	}
	
}