<?php
App::uses('AppModel', 'Model');

class DynamicDetailNote extends AppModel {

     public $actsAs = array('Containable');
     public $belongsTo = array(
        'DynamicDetail' => array(
                    'className' => 'DynamicDetail',
                    'foreignKey' => 'realm_id'
                    ),
        'Note' => array(
                    'className' => 'Note',
                    'foreignKey' => 'note_id'
                    )
        );

    //Get the note ID before we delete it
    public function beforeDelete(){
        if($this->id){
            $class_name     = $this->name;
            $q_r            = $this->findById($this->id);
            $this->note_id  = $q_r[$class_name]['note_id'];
        }
        return true;
    }

    public function afterDelete(){
        if($this->note_id){
            $this->Note->delete($this->note_id);
        }
    }
}

?>
