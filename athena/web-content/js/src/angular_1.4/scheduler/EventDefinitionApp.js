var eventDefinitionApp = angular.module('EventDefinitionApp', ['ngMaterial', 'angular_rest', 'angular_list', 'angular_time_picker']);

eventDefinitionApp.config(function($mdThemingProvider) {
	$mdThemingProvider.theme('default').primaryPalette('grey').accentPalette('blue-grey');
});
	
eventDefinitionApp.service('translate', function() {
	this.load = function(key) {
		return messageResource.get(key, 'messages');
	};
});

//this variable are global because i need to access at variable of one controller from another controller
var activityEventCtrl;
var loadJobDataCtrl ;

eventDefinitionApp.controller('LoadJobDataController', ['translate', '$scope', 'restServices', function(translate, $scope, restServices) {
	loadJobDataCtrl = this;

	loadJobDataCtrl.jobName = '';
	loadJobDataCtrl.jobGroup = '';
	loadJobDataCtrl.triggerName = '';
	loadJobDataCtrl.triggerGroup = '';

	
	loadJobDataCtrl.events = [];
	loadJobDataCtrl.selectedEvent = -1;
	loadJobDataCtrl.datasets = [];
	loadJobDataCtrl.documents = [];
	
	$scope.translate = translate;
	
	loadJobDataCtrl.initJobsValues = function(jobName, jobGroup, triggerName, triggerGroup) {
		loadJobDataCtrl.jobName = jobName;
		loadJobDataCtrl.jobGroup = jobGroup;
		loadJobDataCtrl.triggerName = triggerName;
		loadJobDataCtrl.triggerGroup = triggerGroup;
		loadJobDataCtrl.jobData = null;
		var loadtri = false;
		if(triggerName != undefined && triggerName != "" && triggerGroup != undefined && triggerGroup != "") {
			loadtri = true;
		}
		loadJobDataCtrl.loadDataset();
		loadJobDataCtrl.loadJobData(loadtri);
	}
	
	loadJobDataCtrl.loadDocuments = function(loadTri) {
		var docs = loadJobDataCtrl.jobData.documents;
		for(var i = 0; i < docs.length; i++) {
			var doc = {
				labelId: docs[i].id + "__" + i,
				id: docs[i].id,
				label: docs[i].name,
//				parameters: docs[i].condensedParameters
			};
			
			loadJobDataCtrl.documents.push(doc);
		}
		activityEventCtrl.createNewEvent(loadTri);
	}
	
	loadJobDataCtrl.getEmptyEvent = function() {
		var emptyEvent = {
			jobName: loadJobDataCtrl.jobName,
			jobGroup: loadJobDataCtrl.jobGroup,
			isSuspended: false,
			document: [],
			chrono: {"type": "single"}
		};
		
		activityEventCtrl.typeOperation = 'single';
		
		//load document;
		for (var i = 0; i<loadJobDataCtrl.documents.length; i++) {
			var tmp = {};
			var doc = loadJobDataCtrl.documents[i];
			tmp.label = doc.label;
//			tmp.parameters = doc.parameters;
			tmp.labelId = doc.labelId;
			tmp.id = doc.id;
			emptyEvent.document.push(tmp);
		}
		
		return emptyEvent;
	};
	
	loadJobDataCtrl.loadDataset = function() {
		restServices.get("2.0/datasets", "listDataset")
			.success(function(data, status, headers, config) {
				if (data.hasOwnProperty("errors")) {
					console.error(translate.load("sbi.glossary.load.error"))
				} else {
					loadJobDataCtrl.datasets = data.item;
				}
			})
			.error(function(data, status, headers, config) {
				console.error(translate.load("sbi.glossary.load.error"))
			});
	};
	
	loadJobDataCtrl.loadScheduler = function() {
		var requestString = 
			"getTriggerInfo?jobName = "+loadJobDataCtrl.jobName
			+"&jobGroup = "+loadJobDataCtrl.jobGroup
			+"&triggerGroup = "+loadJobDataCtrl.triggerGroup
			+"&triggerName = "+loadJobDataCtrl.triggerName;
		
		restServices.get("scheduler", requestString	)
			.success(function(data, status, headers, config) {
				if (data.hasOwnProperty("errors")) {
					console.error(translate.load("sbi.glossary.load.error"));
				} else {
					console.log("evento scaricato", data);
					var d = data;
					activityEventCtrl.event.triggerName = d.triggerName;
					activityEventCtrl.event.triggerDescription = d.triggerDescription;
					activityEventCtrl.event.isSuspended = d.isSuspended;
					activityEventCtrl.event.startDate = new Date(d.startDate);
					activityEventCtrl.event.startTime = d.startTime;
					if(d.endTime != undefined && d.endTime != "") {
						activityEventCtrl.event.endTime = d.endTime;
					} else {
						activityEventCtrl.event.endTime = "";
					}
					if(d.endDate != undefined && d.endDate != "") {
						activityEventCtrl.event.endDate = new Date(d.endDate);
					}
					
					activityEventCtrl.event.chrono = d.chrono;
					var op = d.chrono;
					activityEventCtrl.eventSched.repetitionKind = op.type;
					if(op.type == 'single') {
						activityEventCtrl.typeOperation = op.type;
						activityEventCtrl.shedulerType = false;
					} else if(op.type == 'event') {
						activityEventCtrl.typeOperation = op.type;
						activityEventCtrl.shedulerType = false;
						activityEventCtrl.eventSched.event_type = op.parameter.type;
						
						if(op.parameter.type == "dataset") {
							activityEventCtrl.eventSched.dataset = op.parameter.dataset;
							activityEventCtrl.eventSched.frequency = op.parameter.frequency;
						}
					} else {
						activityEventCtrl.typeOperation = "scheduler";
						activityEventCtrl.shedulerType = true;
						if(op.type == 'week') {	
							activityEventCtrl.selectedWeek = op.parameter.days;
						} else if(op.type == 'month') {
							if(op.parameter.hasOwnProperty("months")) {
								activityEventCtrl.typeMonth = false;
								activityEventCtrl.month_repetition = op.parameter.months;
							} else {
								activityEventCtrl.typeMonth = true;
								activityEventCtrl.monthrep_n = op.parameter.numRepetition;
								activityEventCtrl.month_week_number_repetition = op.parameter.weeks;
								activityEventCtrl.month_week_repetition = op.parameter.days;
							}
							
							if(op.parameter.hasOwnProperty("days")) {
								activityEventCtrl.typeMonthWeek = false;
								activityEventCtrl.month_week_number_repetition = op.parameter.weeks;
								activityEventCtrl.month_week_repetition = op.parameter.days;
							} else {
								activityEventCtrl.typeMonthWeek = true;
								activityEventCtrl.dayinmonthrep_week = op.parameter.dayRepetition;
							}
						}
						
					}
					
					
					//carico le informazioni dei documenti
					activityEventCtrl.event.document = d.document;
					activityEventCtrl.selectedDocument = d.document[0];
				}
			})
			.error(function(data, status, headers, config) {
				console.error(translate.load("sbi.glossary.load.error"))
			});
	};
	
	function insertDocChild(node, child) {
		if(node.id == child.parentId) {
			if(!node.hasOwnProperty("childs")) {
				node.childs = [];
			}
			node.childs.push(child);
			return true;
		} else {
			if(node.hasOwnProperty("childs")) {
				for(var i = 0; i<node.childs.length; i++) {
					if(insertDocChild(node.childs[i], child)) {
						return true;
					}
				}
			} else {
				return false;
			}
		}
	};
	
	loadJobDataCtrl.loadJobData = function(loadTri) {
		var parameters = 'jobName=' + loadJobDataCtrl.jobName + '&jobGroup=' + loadJobDataCtrl.jobGroup;
		restServices.get("scheduler", "getJob", parameters)
			.success(function(data, status, headers, config) {
				if (data.hasOwnProperty("errors")) {
					console.error(translate.load("sbi.glossary.load.error"))
				} else {
					console.log("data", data);
					loadJobDataCtrl.jobData = data.job;
					loadJobDataCtrl.lowFunc = [];
					for(var i = 0; i < data.functionality.length; i++) {
						var tmp = data.functionality[i];
						if(!tmp.hasOwnProperty("parentId")) {
							loadJobDataCtrl.lowFunc.push(tmp);
						} else {
							console.log("figlio ");
							for(var j = 0; j < loadJobDataCtrl.lowFunc.length; j++) {
								if(insertDocChild(loadJobDataCtrl.lowFunc[j], tmp)) {
									break;
								}
							}
							
						}
					}
					
					loadJobDataCtrl.loadDocuments(loadTri);
				}
			})
			.error(function(data, status, headers, config) {
				console.error(translate.load("sbi.glossary.load.error"));
			});
	};
	
}]);


eventDefinitionApp.controller('ActivityEventController', ['translate', '$scope', '$mdDialog', '$mdToast', 'restServices', '$timeout', function(translate, $scope, $mdDialog, $mdToast, restServices, $timeout) {
	activityEventCtrl = this;
	activityEventCtrl.event = {};
	
	activityEventCtrl.schedulerTypes = [{value: 'single', label: "Single Execution"},
	                                   {value: 'scheduler', label: "Scheduler Execution"},
	                                   {value: 'event', label: "Event Execution"}
	                                   ];
	
	activityEventCtrl.eventTypes = [
	                              {value: 'rest', label: translate.load("sbi.scheduler.schedulation.events.event.type.rest")},
	                              {value: 'jms', label: translate.load("sbi.scheduler.schedulation.events.event.type.jms")},
	                              {value: 'contextbroker', label: translate.load("sbi.scheduler.schedulation.events.event.type.contextbroker")},
	                              {value: 'dataset', label: translate.load("sbi.scheduler.schedulation.events.event.type.dataset")}
	                              ];
	

	activityEventCtrl.eventIntervals = [{value: 'minute', label: "Minute"},
	                                {value: 'hour', label: "Hour"},
	                                {value: 'day', label: "Daily"},
	                                {value: 'week', label: "Weekly"},
	                                {value: 'month', label: "Monthly"}
	                                ];
	
	activityEventCtrl.eventSched = {};
	activityEventCtrl.selectedDocument = [];
	activityEventCtrl.selectedWeek = [];
	activityEventCtrl.month = [
	                           {label: 'JAN', value: 'JAN'}, 
	                           {label: 'FEB', value: 'FEB'}, 
	                           {label: 'MAR', value: 'MAR'}, 
	                           {label: 'APR', value: 'APR'}, 
	                           {label: 'MAY', value: 'MAY'}, 
	                           {label: 'JUN', value: 'JUN'}, 
	                           {label: 'JUL', value: 'JUL'}, 
	                           {label: 'AUG', value: 'AUG'}, 
	                           {label: 'SEP', value: 'SEP'}, 
	                           {label: 'OCT', value: 'OCT'}, 
	                           {label: 'NOV', value: 'NOV'}, 
	                           {label: 'DIC', value: 'DIC'}
	                           ];
	
	activityEventCtrl.week = [
	                          {label: 'sun', value: '1'}, 
	                          {label: 'mon', value: '2'}, 
	                          {label: 'tue', value: '3'}, 
	                          {label: 'wed', value: '4'}, 
	                          {label: 'thu', value: '5'}, 
	                          {label: 'fri', value: '6'}, 
	                          {label: 'sat', value: '7'}
	                          ];

	
	activityEventCtrl.createNewEvent = function(loadTrigger) {
		activityEventCtrl.event = loadJobDataCtrl.getEmptyEvent();
		activityEventCtrl.setSelectedDocument();
		
		if(loadTrigger) {
			loadJobDataCtrl.loadScheduler();
		}
	};
	
	activityEventCtrl.setSelectedDocument = function() {
		activityEventCtrl.selectedDocument = 
			(activityEventCtrl.event.document == undefined || activityEventCtrl.event.document.length != 0)? 
					activityEventCtrl.event.document[0] : [];
	};
	
	activityEventCtrl.resetForm = function() {
		//check if  there is a change in progress
		var confirm = $mdDialog.confirm().title(translate.load("sbi.glossary.word.modify.progress"))
			.content(translate.load("sbi.glossary.word.modify.progress.message.showGloss"))
			.ariaLabel('Lucky day').ok(translate.load("sbi.general.continue")).cancel(translate.load("sbi.general.cancel"));
			
		$mdDialog.show(confirm)
			.then(function() {
					activityEventCtrl.createNewEvent();
				},
				function() {
				console.log('Annulla');
				}
			);
	};
	
	activityEventCtrl.saveEvent = function(isValid) {
		if (!isValid) {
			return false;
		}
		
		restServices.post("scheduler", "saveTrigger", activityEventCtrl.event)
			.success(function(data) {
				if (data.hasOwnProperty("errors")) {
					console.error(data.errors[0].message);
					console.error(translate.load("sbi.glossary.error.save"));
				} else if (data.Status == "NON OK") {
					console.error(translate.load(data.Message));
				} else {
					$mdToast.show($mdToast.simple().content("SALVATO").position('top').action(
						'OK').highlightAction(false).hideDelay(3000));
				}
			})
			.error(function(data, status, headers, config) {
				console.error(translate.load("sbi.glossary.error.save"));
			});
		  
	}
	
	activityEventCtrl.changeTypeOperation = function() {
		var tip = activityEventCtrl.typeOperation;
		switch(tip) {
			case 'single': 
				activityEventCtrl.eventSched.repetitionKind = 'single'; 
				activityEventCtrl.shedulerType = false; 
				break;
			case 'scheduler': 
				activityEventCtrl.shedulerType = true; 
				break;
			case 'event': 
				activityEventCtrl.eventSched.repetitionKind = 'event'; 
				activityEventCtrl.shedulerType = false; 
				break;
		}
		
		activityEventCtrl.changeTypeFrequency();
	};
	
	activityEventCtrl.getActivityRepetitionKindForScheduler = function() {
		if(activityEventCtrl.eventSched.repetitionKind == undefined 
				|| activityEventCtrl.eventSched.repetitionKind == 'single' 
				|| activityEventCtrl.eventSched.repetitionKind == 'event' ) {
			activityEventCtrl.eventSched.repetitionKind = 'minute';
		}
	};
	
	activityEventCtrl.getNitem = function(n) {
		var r =[];
		for(var i = 1; i <= n; i++) {
			r.push(i);
		}
		return r;
	};
	
	activityEventCtrl.toggleMonthScheduler = function() {
		activityEventCtrl.event.chrono = {
			"type": "month", 
			"parameter": {}
		};
		 
		if(activityEventCtrl.typeMonth == true) {
			activityEventCtrl.event.chrono.parameter.numRepetition = activityEventCtrl.monthrep_n;
		} else {
			activityEventCtrl.event.chrono.parameter.months = [];
			for(var k in activityEventCtrl.month_repetition) {
				activityEventCtrl.event.chrono.parameter.months.push(activityEventCtrl.month_repetition[k]);
			}
		}
			
		if(activityEventCtrl.typeMonthWeek == true) {
			activityEventCtrl.event.chrono.parameter.dayRepetition = activityEventCtrl.dayinmonthrep_week;
		} else {
			var mwnr = activityEventCtrl.month_week_number_repetition;
			
			if(mwnr == undefined) {
				mwnr = 'first';
			}
			
			activityEventCtrl.event.chrono.parameter.weeks = mwnr;
			activityEventCtrl.event.chrono.parameter.days = [];
			
			for(var k in activityEventCtrl.month_week_repetition) {
				activityEventCtrl.event.chrono.parameter.days.push(activityEventCtrl.month_week_repetition[k]);
			}
		}
	};
	
	activityEventCtrl.toggleWeek = function(week) {
		if(week != undefined) {
			var idx = activityEventCtrl.selectedWeek.indexOf(week);
	        if (idx > -1) {
	        	activityEventCtrl.selectedWeek.splice(idx, 1);
	        } else {
	        	activityEventCtrl.selectedWeek.push(week);
	        }
		}
	
        activityEventCtrl.event.chrono = {
    		"type": "week", 
    		"parameter": {
    			"numRepetition": 1, "days": []
    		}
        };
        
        for(var k in activityEventCtrl.selectedWeek ) {
        	activityEventCtrl.event.chrono.parameter.days.push(activityEventCtrl.selectedWeek[k]);
        }
	};
	
	activityEventCtrl.changeTypeFrequency = function() {
		$timeout(function() {
			var tip = activityEventCtrl.eventSched.repetitionKind;
			
			switch(tip) {
				case 'event': 
					activityEventCtrl.event.chrono = {
						"type": "event", 
						"parameter": {
							"type": activityEventCtrl.eventSched.event_type
						}
					};
								
					if(activityEventCtrl.eventSched.event_type == 'dataset') {
						activityEventCtrl.event.chrono.parameter.dataset = activityEventCtrl.eventSched.dataset;
						activityEventCtrl.event.chrono.parameter.frequency = activityEventCtrl.eventSched.frequency;
					}
					
					break;
					
				case 'single': 
					activityEventCtrl.event.chrono = {
						"type": "single"
					}; 
					
					break;
				case 'minute': 
					activityEventCtrl.event.chrono = {
						"type": "minute", 
						"parameter": {
							"numRepetition": activityEventCtrl.eventSched.minute_repetition_n
						}
					}; 
					
					break;
					
				case 'hour': 
					activityEventCtrl.event.chrono = {
						"type": "hour", 
						"parameter": {
							"numRepetition": activityEventCtrl.eventSched.hour_repetition_n
							}
					}; 
					
					break;
					
				case 'day': 
					activityEventCtrl.event.chrono = {
						"type": "day", 
						"parameter": {
							"numRepetition": activityEventCtrl.eventSched.day_repetition_n
							}
					};
					
					break;
					
				case 'week': 
					activityEventCtrl.toggleWeek(); 
					break;
				case 'month': 
					activityEventCtrl.toggleMonthScheduler();
					break;
			}
			
			console.log('chrono', activityEventCtrl.event.chrono);
		}, 500);
	};
	
	activityEventCtrl.isChecked = function (item, list, condition) {
		if(condition) {
			return list == undefined? 
					false : list.indexOf(item) > -1;
		} else {
			return false;
		}
	};
	
	activityEventCtrl.toggleDocFunct = function(doc, funct) {
		if(funct != undefined) {
			if(doc.funct == undefined) {
				doc.funct = [];
			}
			
			var idx = doc.funct.indexOf(funct);
	       
			if (idx > -1) {
	        	doc.funct.splice(idx, 1);
	        } else {
	        	doc.funct.push(funct);
	        }
		}
	};
	
	activityEventCtrl.prova = function() {
		console.log("prova", activityEventCtrl.typeMonth);
	};
}]);