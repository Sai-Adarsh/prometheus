window.VisitView = React.createClass({
	mixins: [ReactFireMixin],
	handleImageData: function(name, data){
		if(name === 'img'){
			return (
				<img className="panel-view-screenshot" src={data}></img>
			);
		}
		else{
			return (
				<span>{data}</span>
			);
		}
	},
	displayProperty: function(name, data, icon, key){
		var imgData = this.handleImageData(name, data);
		if(name === 'Page'){
			return (
				<div className="prop-info" key={key}>
					<i className={'fa fa-icon fa-' + icon}></i>
					<span className="meta-prop-label">{name}:</span>
					<a href={data.url} target="_blank" key={key}>
						{data.title}
						<i className={'fa fa-icon fa-external-link'}></i>
					</a>
				</div>
			);
		}
		else{
			return (
				<div className="prop-info" key={key}>
					<i className={'fa fa-icon fa-' + icon}></i>
					<span className="meta-prop-label">{name}: </span>
					{imgData || data}
				</div>
			);
		}
	},
	render: function(){
		var _this = this;
		var propertyList = [];
		var endNode = null;
		for(var i in this.props.data){
			var prop = {
				name: i,
				data: this.props.data[i],
				icon: 'gear'
			};
			if(i === 'type'){
				prop.icon = 'database';
				propertyList.unshift(prop);
			}
			if(i === 'img'){
				endNode = prop;
			}
			else{
				propertyList.push(prop);
			}
		}
		var meta = this.props.meta;
		propertyList.push.apply(propertyList, [
			{name: 'Page', data: {title: meta.page.title || 'No Title', url: meta.page.url}, icon: 'file-text-o'},
			{name: 'URL', data: meta.page.url, icon: 'link'},
			{name: 'Device', data: meta.browser.device || 'Unknown', icon: 'tablet'},
			{name: 'Browser', data: meta.browser.name + ' ' +  meta.browser.version, icon: 'desktop'},
			{name: 'Width', data: (meta.browser.width || '?') + ' px', icon: 'arrows-h'},
			{name: 'Height', data: (meta.browser.height || '?') + ' px', icon: 'arrows-v'},
			{name: 'Date', data: moment(meta.datetime.timestamp).format('M/D/YYYY'), icon: 'calendar'},
			{name: 'Time', data: moment(meta.datetime.timestamp).format('h:mm A'), icon: 'clock-o'},
			{name: 'City', data: (meta.location.city || 'Unknown') + ', ' + meta.location.country, icon: 'globe'}
		]);
		if(endNode){
			propertyList.push(endNode);
			endNode.icon = 'camera';
		}
		var propertyNodes = propertyList.map(function(prop, index){
			return _this.displayProperty(prop.name, prop.data, prop.icon, index);
		});
		return (
			<div className={'user-visit-view ' + this.props.data.type.toLowerCase()}>
				<h4 className="visit-summary">
					{this.props.data.type + ': ' + moment(this.props.meta.datetime.timestamp).format('M/D/YY h:mm A')}
				</h4>
				<div className="visit-meta-fields">
					{propertyNodes}
				</div>
			</div>
		);
	}
});

window.UserViewModule = React.createClass({
	mixins: [ReactFireMixin],
	getInitialState: function(){
		window.toggleLoading(true);
		return {
			name: '',
			uid: this.props.uid,
			limit: 10
		}
	},
	componentWillMount: function(){
		var fb_url = 'prometheus/users/' + this.state.uid;
		this.firebaseRef = firebase.database().ref(fb_url);
		var _this = this;
		this.firebaseRef.on('value', function(snapshot){
			var data = snapshot.val();
			var visitList = [];
			for(var i in data.visits){
				visitList.push(data.visits[i]);
			}
			_this.setState({
				name: data.profile.name,
				img: data.profile.img || data.profile.picture,
				email: data.profile.email || "Not accessible.",
				visits: visitList
			});
			window.toggleLoading(false);
		}).bind(this);
	},
	componentDidMount: function(){
		
	},
	componentWillUnmount: function(){
		this.firebaseRef.off();
	},
	loadMore: function(){
		this.setState(function(prev, curr){
			return {limit: prev.limit + 10};
		});
	},
	render: function(){
		var visits = _.clone(this.state.visits);
		visits.reverse();
		var visitList = visits.slice(0, this.state.limit);
		var visitNodes = visitList.map(function(visit, index){
			if(visit.visit.type === "TIMER"){
				var timer = visit.visit;
				var length = moment.duration(moment(timer.end).diff(timer.start));
				var duration = '';
				if(length.asMinutes() < 1){
					duration = length.asSeconds() + ' seconds';
				}
				else{
					duration = length.asMinutes() + ' minutes';
				}
				visit.visit.duration = duration;
			}
			return (
				<VisitView
					meta={visit.meta} 
					data={visit.visit} 
					key={index}>
				</VisitView>
			);
		});
		if(this.state.visits.length > this.state.limit){
			return (
				<div className="UserViewModule user-view">
					<h1>{this.state.name}</h1>
					<p>
						<i className="fa fa-icon fa-clock-o"></i>
						Last visited {moment(visits[visits.length-1].meta.datetime.timestamp).fromNow()}
					</p>
					<p>
						<i className="fa fa-icon fa-eye"></i>
						{visits.length} total visits
					</p>
					<p>
						<i className="fa fa-icon fa-code-fork"></i>
						UID: {this.state.uid}
					</p>
					<div className="user-view-img" style={{
						backgroundImage: 'url(' + this.state.img + ')'
					}}></div>
					<div className="visits-field">
						{visitNodes}
						<p>
							Showing {this.state.limit}/{this.state.visits.length}
						</p>
						<button class="load-more" onClick={this.loadMore}>
							Load More Visits
						</button>
					</div>
				</div>
			);
		}
		else{
			return (
				<div className="UserViewModule user-view">
					<h1>{this.state.name}</h1>
					<p>
						<i className="fa fa-icon fa-clock-o"></i>
						Last visited {moment(visits[visits.length-1].meta.datetime.timestamp).fromNow()}
					</p>
					<p>
						<i className="fa fa-icon fa-eye"></i>
						{visits.length} total visits
					</p>
					<p>
						<i className="fa fa-icon fa-code-fork"></i>
						UID: {this.state.uid}
					</p>
					<div className="user-view-img" style={{
						backgroundImage: 'url(' + this.state.img + ')'
					}}></div>
					<div className="visits-field">
						{visitNodes}
						<p>End of History</p>
					</div>
				</div>
			);
		}
	}
});

window.renderUserViewModule = function(uid){
	
	ReactDOM.unmountComponentAtNode(document.getElementById('user-info'));
	ReactDOM.render(
		<UserViewModule uid={uid} />,
		document.getElementById('user-info')
	);

}

window.UserListBox = React.createClass({
	mixins: [ReactFireMixin],
	loadUserView: function(){
		renderUserViewModule(this.props.uid);
	},
	render: function(){
		var timeFormat = '';
		var lastVisit = moment(this.props.lastTime);
		var daySince = -1 * moment.duration(lastVisit.diff(Date.now())).asDays();
		if(daySince < 1){
			timeFormat = lastVisit.format('h:mm A');
		}
		else if(daySince < 7){
			timeFormat = lastVisit.format('dd h:mm A');
		}
		else{
			timeFormat = lastVisit.fromNow();
		}
		return (
			<div className="user-list-div" onClick={this.loadUserView}>
				<div className="user-list-img" style={{
					backgroundImage: 'url(' + this.props.img + ')'
				}}></div>
				<div className="user-list-name">
					{this.props.name}
				</div>
				<div className="user-list-info">
					<i className="fa fa-icon fa-eye"></i>
					<span>
						{this.props.visits}
					</span>
					<i className="fa fa-icon fa-clock-o"></i>
					<span>
						{timeFormat}
					</span>
				</div>
			</div>
		);
	}
});

window.UserModule = React.createClass({
	mixins: [ReactFireMixin],
	getInitialState: function(){
		window.toggleLoading(true);
		return {
			users: [],
			bank: null,
			map: null
		}
	},
	componentWillMount: function(){
		var fb_url = 'prometheus/users';
		this.firebaseRef = firebase.database().ref(fb_url);
		var _this = this;
		var bank = lunr(function(){
			this.field('name', {boost: 10});
			this.ref('id');
		});
		this.firebaseRef.on('value', function(snapshot){
			var users = [];
			var userMap = snapshot.val();
			snapshot.forEach(function(childSnap){
				var user = childSnap.val();
				user.key = childSnap.key;
				var visitList = [];
				for(var i in user.visits){
					visitList.push(user.visits[i]);
				}
				user.visits = visitList;
				if(user.key !== 'ANONYMOUS_USER'){
					var userData = {
						key: user.key,
						img: user.profile.img || user.profile.picture,
						name: user.profile.name,
						visits: user.visits.length,
						lastTime: user.visits[user.visits.length-1].meta.datetime.timestamp,
						visitList: visitList
					}
					users.push(userData)
					bank.add({
						id: user.key,
						name: user.profile.name
					});
				}
			});
			users.sort(function(a, b){
				function getLastVisit(d){
					return d.visitList[d.visitList.length-1];
				}
				return getLastVisit(b).meta.datetime.timestamp - getLastVisit(a).meta.datetime.timestamp;
			});
			_this.setState({
				users: users,
				bank: bank,
				map: userMap
			});
			window.toggleLoading(false);
		}).bind(this);
	},
	componentDidMount: function(){

	},
	componentWillUnmount: function(){
		this.firebaseRef.off();
	},
	searchUser: function(e){
		var query = e.target.value;
		var results = this.state.bank.search(query);
		if(results.length > 0){
			/*var output = [];
			var toRemove = [];
			for(var i = 0; i < results.length; i++){
				var uid = results[i].ref;
				toRemove.push(uid);
				var target = this.state.map[uid];
				target.key = 'result-' + uid;
				output.push(target);
			}
			for(var i = 0; i < this.state.users; i++){
				var existingUser = this.state.user[i];
				if(toRemove.contains(existingUser.key)){
					for(var j = 0; j < toRemove.length; j++){
						if(existingUser.key === toRemove[j]){
							toRemove.splice(j, 1);
							break;
						}
					}
				}
				else{
					output.push(existingUser);
				}
			}
			console.log(results)
			this.setState({
				users: output
			});*/
			renderUserViewModule(results[0].ref);
		}
		/*else{
			console.log('no results')
		}*/
	},
	render: function(){
		var users = this.state.users;
		//var userList = users.slice(0, 5);
		var userNodes = users.map(function(user){
			return (
				<UserListBox 
					name={user.name} 
					img={user.img}
					visits={user.visits}
					lastTime={user.lastTime}
					uid={user.key}
					key={user.key}>
				</UserListBox>
			);

		});
		return (
			<div className="UserModule">
				<input className="search-box" onChange={this.searchUser}></input>
				{userNodes}
			</div>
		);
	}
});

window.renderUserModule = function(){

	ReactDOM.render(
		<UserModule />,
		document.getElementById('user-list')
	);

}

renderUserModule();