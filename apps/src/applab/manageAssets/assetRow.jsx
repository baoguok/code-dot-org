var React = require('react');

var defaultIcons = {
  image: 'fa fa-picture-o',
  audio: 'fa fa-music',
  video: 'fa fa-video-camera'
};

function getThumbnail(type, name) {
  switch (type) {
    case 'image':
      return <img src={'/v3/assets/' + dashboard.project.current.id + '/' + name}
          style={{width: 'auto', maxWidth: '100%', height: 'auto', maxHeight: '100%', zoom: 2, marginTop: '50%', transform: 'translateY(-50%)'}}/>;
    default:
      return <i className={defaultIcons[type] || 'fa fa-question'} style={{margin: '15px 0', fontSize: '32px'}}></i>;
  }
}

module.exports = React.createClass({
  propTypes: {
    name: React.PropTypes.string.isRequired,
    type: React.PropTypes.oneOf(['image', 'audio', 'video', 'unknown']).isRequired,
    choose: React.PropTypes.func.isRequired,
    delete: React.PropTypes.func.isRequired
  },

  getInitialState: function () {
    return {
      action: 'normal',
      actionText: ''
    };
  },

  confirmDelete: function () {
    this.setState({action: 'confirming delete', actionText: ''});
  },

  cancelDelete: function () {
    this.setState({action: 'normal', actionText: ''});
  },

  handleDelete: function () {
    this.setState({action: 'deleting', actionText: ''});

    // TODO: Use Dave's client api when it's finished.
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', this.props.delete);
    xhr.addEventListener('error', (function () {
      this.setState({action: 'confirming delete', actionText: 'Error deleting file.'});
    }).bind(this));

    xhr.open('DELETE', '/v3/assets/' + dashboard.project.current.id + '/' + this.props.name, true);
    xhr.send();
  },

  render: function () {
    var actions;
    switch (this.state.action) {
      case 'normal':
        actions = (
          <td width="250" style={{textAlign: 'right'}}>
            <button onClick={this.props.choose}>Set as Image</button>
            <button><i className="fa fa-eye"></i></button>
            <button className="btn-danger" onClick={this.confirmDelete}><i className="fa fa-trash-o"></i></button>
            {this.state.actionText}
          </td>
        );
        break;
      case 'confirming delete':
        actions = (
          <td width="250" style={{textAlign: 'right'}}>
            <button className="btn-danger" onClick={this.handleDelete}>Delete File</button>
            <button onClick={this.cancelDelete}>Cancel</button>
            {this.state.actionText}
          </td>
        );
        break;
      case 'deleting':
        actions = (
          <td width="250" style={{textAlign: 'right'}}>
            <i className="fa fa-spinner fa-spin" style={{fontSize: '32px', marginRight: '15px'}}></i>
          </td>
        );
        break;
    }

    return (
      <tr className="assetRow">
        <td width="80"><div className="assetThumbnail" style={{
          width: '60px', height: '60px', margin: '10px auto', background: '#eee', border: '1px solid #ccc', textAlign: 'center'
        }}>{getThumbnail(this.props.type, this.props.name)}</div></td>
        <td>{this.props.name}</td>
      {actions}
      </tr>
    );
  }
});
