<?php
App::uses('AppModel', 'Model');
App::uses('AuthComponent', 'Controller/Component');

/**
 * User Model
 *
 * @property Group $Group
 */
class User extends AppModel {

    //Used to build the list of children an Access Provider may have up to the end nodes.
    private $ap_children    = array();

/**
 * Validation rules
 *
 * @var array
 */
	public $validate = array(
		'username' => array(
            'required' => array(
                'rule' => array('notEmpty'),
                'message' => 'Value is required'
            ),
            'unique' => array(
                'rule'    => 'isUnique',
                'message' => 'This name is already taken'
            )
        ),
		'password' => array(
			'notempty' => array(
				'rule' => array('notempty'),
				//'message' => 'Your custom message here',
				//'allowEmpty' => false,
				//'required' => false,
				//'last' => false, // Stop validation after this rule
				//'on' => 'create', // Limit validation to 'create' or 'update' operations
			),
		),
		'group_id' => array(
			'numeric' => array(
				'rule' => array('numeric'),
				//'message' => 'Your custom message here',
				//'allowEmpty' => false,
				//'required' => false,
				//'last' => false, // Stop validation after this rule
				//'on' => 'create', // Limit validation to 'create' or 'update' operations
			),
		),
	);

	//The Associations below have been created with all possible keys, those that are not needed can be removed

/**
 * belongsTo associations
 *
 * @var array
 */
	public $belongsTo = array(
        'Country' => array(
            'className'     => 'Country',
			'foreignKey'    => 'country_id'
        ),
		'Group' => array(
			'className' => 'Group',
			'foreignKey' => 'group_id',
			'conditions' => '',
			'fields' => '',
			'order' => ''
		),
        'Language' => array(
            'className'     => 'Language',
			'foreignKey'    => 'language_id'
        ),
        'Realm' => array(
            'className'     => 'Realm',
			'foreignKey'    => 'realm_id'
        ),
        'Owner' => array(
            'className'     => 'User',
            'foreignKey'    => 'parent_id'
        )
        
	);

    public $hasMany = array(
        'Na',
        'Tag',
        'Realm',
        'UserNote' => array(
            'dependent'     => true   
        ),
        'Radcheck' => array(
            'className'     => 'Radcheck',
            'foreignKey'	=> false,
            'finderQuery'   => 'SELECT Radcheck.* FROM radcheck AS Radcheck, users WHERE users.username=Radcheck.username AND users.id={$__cakeID__$}',
            'dependent'     => true
        )
    );

    public $actsAs = array('Acl' => array('type' => 'requester'),'Containable','Tree');


    public function beforeSave($options = array()) {

        if((isset($this->data['User']['token']))&&($this->data['User']['token']=='')){
            App::uses('String', 'Utility');
            $this->data['User']['token'] = String::uuid();
        }

        if(isset($this->data['User']['password'])){
            $this->clearPwd = $this->data['User']['password']; //Keep a copy of the original one
            $this->data['User']['password'] = AuthComponent::password($this->data['User']['password']);
        }
        return true;
    }

    public function afterSave($created){

        if($created){
            $group_name  = Configure::read('group.user');
            $q_r        = $this->Group->find('first',array('conditions' =>array('Group.name' => $group_name)));
            $group_id   = $q_r['Group']['id'];
            //Check if this is a permanent user
            if($this->data['User']['group_id'] == $group_id){
                $this->_add_radius_user();
            }
        }
    }

    private function _add_radius_user(){
        $this->Radcheck = ClassRegistry::init('Radcheck');
        $this->Radcheck->create();

        //The username with it's password (Cleartext-Password)
        $username                   = $this->data['User']['username'];
        $this->_add_radcheck_item($username,'Cleartext-Password',$this->clearPwd);

        //Realm (Rd-Realm)
        if(array_key_exists('realm_id',$this->data['User'])){ //It may be missing; you never know...
            if($this->data['User']['realm_id'] != ''){
                $q_r = ClassRegistry::init('Realm')->findById($this->data['User']['realm_id']);
                $realm_name = $q_r['Realm']['name'];
                $this->_add_radcheck_item($username,'Rd-Realm',$realm_name);
            }
        }

        //Auth Type (Rd-Auth-Type) = sql by default

        //$this->_add_radcheck_item($username,'Rd-Auth-Type','sql');

        //Profile name (User-Profile)
        if(array_key_exists('profile_id',$this->data['User'])){ //It may be missing; you never know...
            if($this->data['User']['profile_id'] != ''){
                $q_r = ClassRegistry::init('Profile')->findById($this->data['User']['profile_id']);
                $profile_name = $q_r['Profile']['name'];
                $this->_add_radcheck_item($username,'User-Profile',$profile_name);
            }
        }


        //enabled or disabled (Rd-Account-Disabled)
        if(array_key_exists('active',$this->data['User'])){ //It may be missing; you never know...
            if($this->data['User']['active'] != ''){
                if($this->data['User']['active'] == 1){ //Reverse the logic...
                    $dis = 0;
                }else{
                    $dis = 1;
                }
                $this->_add_radcheck_item($username,'Rd-Account-Disabled',$dis);
            }
        }  
    }

    private function _add_radcheck_item($username,$item,$value,$op = ":="){

        $this->Radcheck = ClassRegistry::init('Radcheck');
        $this->Radcheck->create();
        $d['Radcheck']['username']  = $username;
        $d['Radcheck']['op']        = $op;
        $d['Radcheck']['attribute'] = $item;
        $d['Radcheck']['value']     = $value;
        $this->Radcheck->save($d);
        $this->Radcheck->id         = null;
    }

    //This function is required for the Acl behaviour....
    public function parentNode() {
        if (!$this->id && empty($this->data)) {
            return null;
        }
        if (isset($this->data['User']['group_id'])) {
            $groupId = $this->data['User']['group_id'];
        } else {
            $groupId = $this->field('group_id');
        }
        if (!$groupId) {
            return null;
        } else {
            return array('Group' => array('id' => $groupId));
        }
    }

    //Used to get a list of all the access provider's owned by $ap_id, including their children and children's children etc...
    public function find_access_provider_children($ap_id){

        $ap_name = Configure::read('group.ap');

        $this->contain();
        $parent = $this->findById($ap_id);
        $this->contain('Group');
        $parentAndChildren = $this->find('threaded', array(
            'conditions' => array(
                'User.lft >='    => $parent['User']['lft'], 
                'User.rght <='   => $parent['User']['rght'],
                'Group.name'    => $ap_name
            )
        ));

        $this->_build_access_provider_children($parentAndChildren);
        return $this->ap_children;
    }

    //Called recusrively to find the children downward from an AP
    private function _build_access_provider_children($results){
        foreach($results as $i){
            $id         = $i['User']['id'];
            $username   = $i['User']['username'];
            array_push($this->ap_children,array('id' => $id, 'username' => $username));
            if(count($i['children']) > 0){ //Call recursivley
                $this->_build_access_provider_children($i['children']);
            }
        }
    }
}
