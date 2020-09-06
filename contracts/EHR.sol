pragma solidity >=0.5.1 <0.6.0;

contract EHR {
    uint public Id;
    uint[] public recordIds;
    //mapping (uint => address );
    mapping (uint => Record) stored_records;
    

    struct Record{
        uint record_id;
        string patient_name;
        string patient_email;
        string facilitator_name;
        string facilitator_role;
        string record_name;
        string added_date;
        string content_hash;
        address uploader_address;
        bool isCreated;
    }
    
    constructor() public payable{
        Id = 0;
    }
    event recordCreated(string _patient_name , string _patient_email, string _facilitator_name, string _facilitator_role, string _record_name, string _added_date, string _content_hash);

    function add_record(string memory _patient_name, string memory _patient_email,
    string memory _facilitator_name, string memory _facilitator_role,
    string memory _record_name, string memory _added_date, string memory _content_hash) public 
    {   
        require(msg.sender != address(0));
        Id += 1;
        Record memory record = Record(Id,_patient_name, _patient_email, _facilitator_name,_facilitator_role, _record_name, _added_date, _content_hash,msg.sender,true);
        stored_records[Id] = record;
        recordIds.push(Id);
        emit recordCreated(_patient_name, _patient_email, _facilitator_name,_facilitator_role,_record_name,_added_date,_content_hash );
    }
    function getRecordIds() public view returns(uint[] memory) {
        return recordIds;
    }
    
    function get_record (uint _record_id)
    public view returns (uint, string memory, string memory, string memory, string memory, string memory,
    string memory,string memory)
    {
        Record memory record = stored_records[_record_id];
        require(record.isCreated);
        return (record.record_id, record.patient_name, record.patient_email,
                record.facilitator_name, record.facilitator_role,
                record.record_name, record.added_date,record.content_hash);
        
    }
    
    
  

}