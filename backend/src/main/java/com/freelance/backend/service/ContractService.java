package com.freelance.backend.service;

import com.freelance.backend.entity.Contract;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.ContractRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ContractService {

    @Autowired
    private ContractRepository contractRepository;

    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    public Contract getContractById(String id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + id));
    }

    public Contract createContract(Contract contract) {
        return contractRepository.save(contract);
    }

    public Contract updateContractStatus(String id, String status) {
        Contract contract = getContractById(id);
        contract.setStatus(status);
        return contractRepository.save(contract);
    }
}
